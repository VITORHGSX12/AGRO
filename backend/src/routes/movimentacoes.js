import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/movimentacoes - Lista movimentações com dados dos animais e piquetes
router.get('/', (req, res) => {
    try {
        const { animal_id, tipo, data_inicio, data_fim } = req.query;

        let query = `
            SELECT 
                m.*,
                a.identificacao as animal_brinco,
                a.categoria as animal_categoria,
                a.raca as animal_raca,
                COALESCE(po.nome, m.piquete_origem_nome) as piquete_origem_nome,
                COALESCE(pd.nome, m.piquete_destino_nome) as piquete_destino_nome
            FROM movimentacoes_animais m
            JOIN animais a ON m.animal_id = a.id
            LEFT JOIN piquetes po ON m.piquete_origem_id = po.id
            LEFT JOIN piquetes pd ON m.piquete_destino_id = pd.id
            WHERE 1=1
        `;
        const params = [];

        if (animal_id) {
            query += ` AND m.animal_id = ?`;
            params.push(Number(animal_id));
        }

        if (tipo) {
            query += ` AND m.tipo = ?`;
            params.push(tipo);
        }

        if (data_inicio) {
            query += ` AND m.data >= ?`;
            params.push(data_inicio);
        }

        if (data_fim) {
            query += ` AND m.data <= ?`;
            params.push(data_fim);
        }

        query += ` ORDER BY m.data DESC, m.created_at DESC`;

        const movimentacoes = db.prepare(query).all(...params);
        res.json(movimentacoes);
    } catch (error) {
        console.error('Erro ao buscar movimentações:', error);
        res.status(500).json({ error: 'Erro ao listar movimentações' });
    }
});

// POST /api/movimentacoes - Registra movimentação e aplica regras de negócio automaticamente
router.post('/', (req, res) => {
    try {
        const {
            animal_id,
            tipo,
            data,
            valor = 0,
            piquete_destino_id = null,
            observacao = '',
            gerar_lancamento_financeiro = true
        } = req.body;

        if (!animal_id) {
            return res.status(400).json({ error: 'Animal é obrigatório' });
        }

        const validTipos = ['compra', 'venda', 'morte', 'transferencia'];
        if (!validTipos.includes(tipo)) {
            return res.status(400).json({ error: `Tipo de movimentação inválido. Opções: ${validTipos.join(', ')}` });
        }

        if (!data) {
            return res.status(400).json({ error: 'Data da movimentação é obrigatória' });
        }

        if (tipo === 'transferencia' && !piquete_destino_id) {
            return res.status(400).json({ error: 'Piquete de destino é obrigatório para transferências' });
        }

        // Execução em transação atômica
        const executeMovimentacao = db.transaction(() => {
            const animal = db.prepare('SELECT * FROM animais WHERE id = ?').get(animal_id);
            if (!animal) {
                throw new Error('Animal não encontrado');
            }

            const piqueteOrigemId = animal.piquete_atual_id;
            let piqueteOrigemNome = null;
            let piqueteDestinoNome = null;

            if (piqueteOrigemId) {
                const po = db.prepare('SELECT nome FROM piquetes WHERE id = ?').get(piqueteOrigemId);
                if (po) piqueteOrigemNome = po.nome;
            }

            if (piquete_destino_id) {
                const pd = db.prepare('SELECT nome FROM piquetes WHERE id = ?').get(Number(piquete_destino_id));
                if (pd) piqueteDestinoNome = pd.nome;
            }

            // 1. Inserir a movimentação com snapshot de nomes
            const insertMov = db.prepare(`
                INSERT INTO movimentacoes_animais (
                    animal_id, tipo, data, valor,
                    piquete_origem_id, piquete_destino_id,
                    piquete_origem_nome, piquete_destino_nome,
                    observacao
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                animal_id,
                tipo,
                data,
                Number(valor) || 0,
                piqueteOrigemId,
                tipo === 'transferencia' ? Number(piquete_destino_id) : (tipo === 'compra' && piquete_destino_id ? Number(piquete_destino_id) : null),
                piqueteOrigemNome,
                piqueteDestinoNome,
                observacao ? observacao.trim() : null
            );

            // 2. Aplicar regra de negócio no status / piquete do animal
            if (tipo === 'venda') {
                db.prepare(`
                    UPDATE animais 
                    SET status = 'vendido', piquete_atual_id = NULL 
                    WHERE id = ?
                `).run(animal_id);

                // Gera receita se valor > 0
                if (gerar_lancamento_financeiro && Number(valor) > 0) {
                    db.prepare(`
                        INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao, animal_id)
                        VALUES (?, 'receita', 'venda_animal', ?, ?, ?, ?)
                    `).run(
                        animal.fazenda_id,
                        Number(valor),
                        data,
                        `Venda do animal brinco ${animal.identificacao} (${animal.categoria})`,
                        animal_id
                    );
                }
            } else if (tipo === 'morte') {
                db.prepare(`
                    UPDATE animais 
                    SET status = 'morto', piquete_atual_id = NULL 
                    WHERE id = ?
                `).run(animal_id);
            } else if (tipo === 'transferencia') {
                db.prepare(`
                    UPDATE animais 
                    SET piquete_atual_id = ? 
                    WHERE id = ?
                `).run(Number(piquete_destino_id), animal_id);

                // Regra de Rotação de Pastagem: fecha saída no piquete de origem e abre entrada no destino
                if (piqueteOrigemId) {
                    db.prepare(`
                        UPDATE rotacao_pastagem 
                        SET data_saida = ? 
                        WHERE piquete_id = ? AND data_saida IS NULL
                    `).run(data, piqueteOrigemId);
                }

                if (piquete_destino_id) {
                    const countDestino = db.prepare(`
                        SELECT COUNT(*) as count FROM animais 
                        WHERE piquete_atual_id = ? AND status = 'ativo'
                    `).get(Number(piquete_destino_id))?.count || 1;

                    db.prepare(`
                        INSERT INTO rotacao_pastagem (piquete_id, data_entrada, quantidade_animais, observacao)
                        VALUES (?, ?, ?, ?)
                    `).run(
                        Number(piquete_destino_id),
                        data,
                        countDestino,
                        `Transferência do animal brinco ${animal.identificacao} (${observacao || 'Rotação de lote'})`
                    );
                }
            } else if (tipo === 'compra') {
                db.prepare(`
                    UPDATE animais 
                    SET status = 'ativo', piquete_atual_id = COALESCE(?, piquete_atual_id) 
                    WHERE id = ?
                `).run(piquete_destino_id ? Number(piquete_destino_id) : null, animal_id);

                // Gera despesa se valor > 0
                if (gerar_lancamento_financeiro && Number(valor) > 0) {
                    db.prepare(`
                        INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao, animal_id)
                        VALUES (?, 'despesa', 'compra_animal', ?, ?, ?, ?)
                    `).run(
                        animal.fazenda_id,
                        Number(valor),
                        data,
                        `Compra do animal brinco ${animal.identificacao} (${animal.categoria})`,
                        animal_id
                    );
                }
            }

            return insertMov.lastInsertRowid;
        });

        const newMovId = executeMovimentacao();

        const created = db.prepare(`
            SELECT 
                m.*,
                a.identificacao as animal_brinco,
                a.categoria as animal_categoria,
                a.status as animal_status,
                COALESCE(po.nome, m.piquete_origem_nome) as piquete_origem_nome,
                COALESCE(pd.nome, m.piquete_destino_nome) as piquete_destino_nome
            FROM movimentacoes_animais m
            JOIN animais a ON m.animal_id = a.id
            LEFT JOIN piquetes po ON m.piquete_origem_id = po.id
            LEFT JOIN piquetes pd ON m.piquete_destino_id = pd.id
            WHERE m.id = ?
        `).get(newMovId);

        res.status(201).json(created);
    } catch (error) {
        console.error('Erro ao registrar movimentação:', error);
        res.status(500).json({ error: error.message || 'Erro ao registrar movimentação' });
    }
});

export default router;
