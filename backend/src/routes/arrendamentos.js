import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/arrendamentos - Lista contratos de arrendamento com dados do piquete
router.get('/', (req, res) => {
    try {
        const { tipo, status } = req.query;

        let query = `
            SELECT 
                c.*,
                p.nome as piquete_nome,
                p.tamanho_hectares as piquete_tamanho_hectares,
                (SELECT COUNT(*) FROM animais a WHERE a.piquete_atual_id = p.id AND a.status = 'ativo') as total_animais_no_piquete
            FROM contratos_arrendamento c
            LEFT JOIN piquetes p ON c.piquete_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (tipo) {
            query += ` AND c.tipo = ?`;
            params.push(tipo);
        }

        if (status) {
            query += ` AND c.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY c.status ASC, c.created_at DESC`;

        const contratos = db.prepare(query).all(...params);

        // Calcula a prévia do valor mensal para cada contrato
        const enriched = contratos.map(c => {
            let valorCalculadoMes = c.valor;
            if (c.unidade_cobranca === 'por_hectare_mes') {
                const hectares = c.piquete_tamanho_hectares || 1;
                valorCalculadoMes = c.valor * hectares;
            } else if (c.unidade_cobranca === 'por_cabeca_mes') {
                const cabecas = c.total_animais_no_piquete || 0;
                valorCalculadoMes = c.valor * (cabecas > 0 ? cabecas : 1);
            }

            return {
                ...c,
                valor_calculado_mes: valorCalculadoMes
            };
        });

        res.json(enriched);
    } catch (error) {
        console.error('Erro ao buscar contratos de arrendamento:', error);
        res.status(500).json({ error: 'Erro ao buscar contratos de arrendamento' });
    }
});

// POST /api/arrendamentos - Cria novo contrato de arrendamento
router.post('/', (req, res) => {
    try {
        const {
            fazenda_id = 1,
            piquete_id = null,
            tipo,
            contraparte_nome,
            valor,
            unidade_cobranca,
            data_inicio,
            data_fim = null,
            status = 'ativo',
            observacoes = ''
        } = req.body;

        if (!['pago', 'recebido'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo deve ser "pago" (arrendo de terceiro) ou "recebido" (arrendo para terceiro)' });
        }

        if (!contraparte_nome || !contraparte_nome.trim()) {
            return res.status(400).json({ error: 'Nome da contraparte (proprietário/locatário) é obrigatório' });
        }

        if (valor === undefined || Number(valor) <= 0) {
            return res.status(400).json({ error: 'Valor deve ser maior que zero' });
        }

        if (!['por_cabeca_mes', 'por_hectare_mes', 'valor_fixo_mes'].includes(unidade_cobranca)) {
            return res.status(400).json({ error: 'Unidade de cobrança inválida' });
        }

        if (!data_inicio) {
            return res.status(400).json({ error: 'Data de início do contrato é obrigatória' });
        }

        const insert = db.prepare(`
            INSERT INTO contratos_arrendamento (
                fazenda_id, piquete_id, tipo, contraparte_nome,
                valor, unidade_cobranca, data_inicio, data_fim, status, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            fazenda_id,
            piquete_id ? Number(piquete_id) : null,
            tipo,
            contraparte_nome.trim(),
            Number(valor),
            unidade_cobranca,
            data_inicio,
            data_fim || null,
            status,
            observacoes ? observacoes.trim() : null
        );

        const created = db.prepare(`
            SELECT 
                c.*,
                p.nome as piquete_nome,
                p.tamanho_hectares as piquete_tamanho_hectares
            FROM contratos_arrendamento c
            LEFT JOIN piquetes p ON c.piquete_id = p.id
            WHERE c.id = ?
        `).get(insert.lastInsertRowid);

        res.status(201).json(created);
    } catch (error) {
        console.error('Erro ao cadastrar contrato de arrendamento:', error);
        res.status(500).json({ error: 'Erro ao cadastrar contrato de arrendamento' });
    }
});

// POST /api/arrendamentos/:id/lancar-pagamento - Executa o lançamento financeiro automático do mês
router.post('/:id/lancar-pagamento', (req, res) => {
    try {
        const { id } = req.params;
        const { data_pagamento = new Date().toISOString().split('T')[0] } = req.body;

        const contrato = db.prepare(`
            SELECT 
                c.*,
                p.nome as piquete_nome,
                p.tamanho_hectares as piquete_tamanho_hectares,
                (SELECT COUNT(*) FROM animais a WHERE a.piquete_atual_id = p.id AND a.status = 'ativo') as total_animais_no_piquete
            FROM contratos_arrendamento c
            LEFT JOIN piquetes p ON c.piquete_id = p.id
            WHERE c.id = ?
        `).get(id);

        if (!contrato) {
            return res.status(404).json({ error: 'Contrato de arrendamento não encontrado' });
        }

        // Calcula o valor conforme a unidade de cobrança
        let valorCalculado = contrato.valor;
        let detalheCalculo = `Valor fixo: R$ ${contrato.valor.toFixed(2)}`;

        if (contrato.unidade_cobranca === 'por_hectare_mes') {
            const hectares = contrato.piquete_tamanho_hectares || 1;
            valorCalculado = contrato.valor * hectares;
            detalheCalculo = `R$ ${contrato.valor.toFixed(2)}/ha x ${hectares} ha (${contrato.piquete_nome || 'Área'})`;
        } else if (contrato.unidade_cobranca === 'por_cabeca_mes') {
            const cabecas = contrato.total_animais_no_piquete || 0;
            const multCabecas = cabecas > 0 ? cabecas : 1;
            valorCalculado = contrato.valor * multCabecas;
            detalheCalculo = `R$ ${contrato.valor.toFixed(2)}/cab x ${multCabecas} cabeças (${contrato.piquete_nome || 'Pasto'})`;
        }

        const tipoFin = contrato.tipo === 'pago' ? 'despesa' : 'receita';
        const catFin = contrato.tipo === 'pago' ? 'aluguel_pasto_pago' : 'aluguel_pasto_recebido';
        const prefixoDesc = contrato.tipo === 'pago' ? 'Pagamento Arrendamento Pasto' : 'Recebimento Arrendamento Pasto';
        const descCompleta = `${prefixoDesc} - ${contrato.contraparte_nome} (${detalheCalculo})`;

        const insertFin = db.prepare(`
            INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            contrato.fazenda_id,
            tipoFin,
            catFin,
            valorCalculado,
            data_pagamento,
            descCompleta
        );

        const lancamento = db.prepare('SELECT * FROM financeiro WHERE id = ?').get(insertFin.lastInsertRowid);

        res.status(201).json({
            message: 'Lançamento financeiro do arrendamento gerado com sucesso!',
            lancamento,
            valor_calculado: valorCalculado
        });
    } catch (error) {
        console.error('Erro ao lançar pagamento do arrendamento:', error);
        res.status(500).json({ error: error.message || 'Erro ao lançar pagamento do arrendamento' });
    }
});

// DELETE /api/arrendamentos/:id - Remove contrato
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM contratos_arrendamento WHERE id = ?').run(id);
        res.json({ message: 'Contrato de arrendamento excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir contrato:', error);
        res.status(500).json({ error: 'Erro ao excluir contrato' });
    }
});

export default router;
