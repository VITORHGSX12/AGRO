import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/folha - Retorna a folha de pagamento do mês (com auto-inicialização para funcionários ativos)
router.get('/', (req, res) => {
    try {
        const today = new Date();
        const mesReferencia = req.query.mes_referencia || today.toISOString().slice(0, 7); // 'YYYY-MM'

        // 1. Busca funcionários ativos
        const funcionariosAtivos = db.prepare(`SELECT * FROM funcionarios WHERE status = 'ativo'`).all();

        // 2. Garante que todo funcionário ativo tem uma linha na folha do mês
        const insertFolha = db.prepare(`
            INSERT OR IGNORE INTO folha_pagamento (
                funcionario_id, mes_referencia, salario_base,
                beneficios, descontos, valor_liquido, status
            ) VALUES (?, ?, ?, 0, 0, ?, 'pendente')
        `);

        for (const func of funcionariosAtivos) {
            const salarioBase = func.tipo_contratacao === 'fixo' ? func.salario : (func.valor_diaria * 22); // estimativa inicial de dias se diarista
            insertFolha.run(func.id, mesReferencia, salarioBase, salarioBase);
        }

        // 3. Consulta as folhas do mês com dados dos funcionários
        const query = `
            SELECT 
                fp.*,
                f.nome as funcionario_nome,
                f.funcao as funcionario_funcao,
                f.tipo_contratacao as funcionario_tipo_contratacao,
                f.mora_na_fazenda as funcionario_mora_na_fazenda
            FROM folha_pagamento fp
            JOIN funcionarios f ON fp.funcionario_id = f.id
            WHERE fp.mes_referencia = ?
            ORDER BY f.nome ASC
        `;

        const folhas = db.prepare(query).all(mesReferencia);

        // Resumo estatístico
        const totalBase = folhas.reduce((acc, f) => acc + f.salario_base, 0);
        const totalBeneficios = folhas.reduce((acc, f) => acc + f.beneficios, 0);
        const totalDescontos = folhas.reduce((acc, f) => acc + f.descontos, 0);
        const totalLiquido = folhas.reduce((acc, f) => acc + f.valor_liquido, 0);
        const totalPago = folhas.filter(f => f.status === 'pago').reduce((acc, f) => acc + f.valor_liquido, 0);
        const totalPendente = folhas.filter(f => f.status === 'pendente').reduce((acc, f) => acc + f.valor_liquido, 0);

        res.json({
            mes_referencia: mesReferencia,
            resumo: {
                total_base: totalBase,
                total_beneficios: totalBeneficios,
                total_descontos: totalDescontos,
                total_liquido: totalLiquido,
                total_pago: totalPago,
                total_pendente: totalPendente,
                qtd_colaboradores: folhas.length
            },
            folhas
        });
    } catch (error) {
        console.error('Erro ao buscar folha de pagamento:', error);
        res.status(500).json({ error: 'Erro ao buscar folha de pagamento' });
    }
});

// PUT /api/folha/:id - Atualiza valores de benefícios, descontos ou salário base de um colaborador no mês
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { salario_base, beneficios = 0, descontos = 0, observacoes = '' } = req.body;

        const folha = db.prepare('SELECT * FROM folha_pagamento WHERE id = ?').get(id);
        if (!folha) {
            return res.status(404).json({ error: 'Registro da folha não encontrado' });
        }

        const base = salario_base !== undefined ? Number(salario_base) : folha.salario_base;
        const ben = Number(beneficios) || 0;
        const desc = Number(descontos) || 0;
        const valorLiquido = Math.max(0, base + ben - desc);

        db.prepare(`
            UPDATE folha_pagamento SET
                salario_base = ?,
                beneficios = ?,
                descontos = ?,
                valor_liquido = ?,
                observacoes = ?
            WHERE id = ?
        `).run(base, ben, desc, valorLiquido, observacoes ? observacoes.trim() : null, id);

        const updated = db.prepare(`
            SELECT 
                fp.*,
                f.nome as funcionario_nome,
                f.funcao as funcionario_funcao
            FROM folha_pagamento fp
            JOIN funcionarios f ON fp.funcionario_id = f.id
            WHERE fp.id = ?
        `).get(id);

        res.json(updated);
    } catch (error) {
        console.error('Erro ao atualizar folha de pagamento:', error);
        res.status(500).json({ error: 'Erro ao atualizar folha de pagamento' });
    }
});

// POST /api/folha/:id/pagar - Marca folha individual como paga e gera lançamento financeiro automático
router.post('/:id/pagar', (req, res) => {
    try {
        const { id } = req.params;
        const { data_pagamento = new Date().toISOString().split('T')[0] } = req.body;

        const executePagamento = db.transaction(() => {
            const folha = db.prepare(`
                SELECT 
                    fp.*,
                    f.nome as funcionario_nome,
                    f.fazenda_id
                FROM folha_pagamento fp
                JOIN funcionarios f ON fp.funcionario_id = f.id
                WHERE fp.id = ?
            `).get(id);

            if (!folha) {
                throw new Error('Registro da folha não encontrado');
            }

            if (folha.status === 'pago') {
                return { folha, jaPago: true };
            }

            // 1. Atualiza status na folha
            db.prepare(`
                UPDATE folha_pagamento 
                SET status = 'pago', data_pagamento = ? 
                WHERE id = ?
            `).run(data_pagamento, id);

            // 2. Gera lançamento financeiro de despesa (categoria 'salario')
            const desc = `Salário - ${folha.funcionario_nome} (Ref: ${folha.mes_referencia})`;
            const insertFin = db.prepare(`
                INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
                VALUES (?, 'despesa', 'salario', ?, ?, ?)
            `).run(
                folha.fazenda_id,
                folha.valor_liquido,
                data_pagamento,
                desc
            );

            const lancamento = db.prepare('SELECT * FROM financeiro WHERE id = ?').get(insertFin.lastInsertRowid);
            const updatedFolha = db.prepare('SELECT * FROM folha_pagamento WHERE id = ?').get(id);

            return { folha: updatedFolha, lancamento, jaPago: false };
        });

        const result = executePagamento();
        res.json({
            message: result.jaPago ? 'Folha já estava quitada' : 'Folha de pagamento quitada e lançada no Financeiro com sucesso!',
            ...result
        });
    } catch (error) {
        console.error('Erro ao quitar folha de pagamento:', error);
        res.status(500).json({ error: error.message || 'Erro ao processar pagamento da folha' });
    }
});

// POST /api/folha/pagar-todas - Quita todas as folhas pendentes do mês de uma só vez
router.post('/pagar-todas', (req, res) => {
    try {
        const { mes_referencia, data_pagamento = new Date().toISOString().split('T')[0] } = req.body;
        if (!mes_referencia) {
            return res.status(400).json({ error: 'Mês de referência é obrigatório' });
        }

        const executeLote = db.transaction(() => {
            const pendentes = db.prepare(`
                SELECT 
                    fp.*,
                    f.nome as funcionario_nome,
                    f.fazenda_id
                FROM folha_pagamento fp
                JOIN funcionarios f ON fp.funcionario_id = f.id
                WHERE fp.mes_referencia = ? AND fp.status = 'pendente'
            `).all(mes_referencia);

            let count = 0;
            let totalPago = 0;

            for (const item of pendentes) {
                db.prepare(`
                    UPDATE folha_pagamento 
                    SET status = 'pago', data_pagamento = ? 
                    WHERE id = ?
                `).run(data_pagamento, item.id);

                const desc = `Salário - ${item.funcionario_nome} (Ref: ${item.mes_referencia})`;
                db.prepare(`
                    INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
                    VALUES (?, 'despesa', 'salario', ?, ?, ?)
                `).run(
                    item.fazenda_id,
                    item.valor_liquido,
                    data_pagamento,
                    desc
                );

                count++;
                totalPago += item.valor_liquido;
            }

            return { count, totalPago };
        });

        const result = executeLote();
        res.json({
            message: `${result.count} folha(s) de pagamento quitadas com sucesso!`,
            ...result
        });
    } catch (error) {
        console.error('Erro ao quitar folhas em lote:', error);
        res.status(500).json({ error: error.message || 'Erro ao processar pagamento em lote' });
    }
});

export default router;
