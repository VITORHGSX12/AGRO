import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// ==============================================================================
// 0. KPIS CONSOLIDADOS DO MÓDULO AGRÍCOLA
// ==============================================================================
router.get('/kpis', (req, res) => {
    try {
        const talhoes = db.prepare('SELECT * FROM talhoes').all();
        const safras = db.prepare('SELECT * FROM safras').all();
        const insumos = db.prepare('SELECT * FROM insumos_agricolas').all();

        const totalTalhoes = talhoes.length;
        const areaTotalHa = talhoes.reduce((acc, t) => acc + (t.area_hectares || 0), 0);

        // Identifica talhões com safras ativas (não colhidas)
        const talhoesComSafraAtivaIds = new Set(
            safras.filter(s => s.status !== 'colhida').map(s => s.talhao_id)
        );

        const areaPlantadaHa = talhoes
            .filter(t => talhoesComSafraAtivaIds.has(t.id))
            .reduce((acc, t) => acc + (t.area_hectares || 0), 0);

        const areaDescansoHa = Math.max(0, Number((areaTotalHa - areaPlantadaHa).toFixed(2)));

        const safrasAtivas = safras.filter(s => s.status !== 'colhida').length;
        const totalInvestidoInsumos = insumos.reduce((acc, i) => acc + (i.valor || 0), 0);
        const totalReceitaColheitas = safras
            .filter(s => s.status === 'colhida')
            .reduce((acc, s) => acc + (s.valor_venda_total || 0), 0);

        res.json({
            total_talhoes: totalTalhoes,
            area_total_ha: Number(areaTotalHa.toFixed(2)),
            area_plantada_ha: Number(areaPlantadaHa.toFixed(2)),
            area_descanso_ha: areaDescansoHa,
            safras_ativas: safrasAtivas,
            total_investido_insumos: Number(totalInvestidoInsumos.toFixed(2)),
            total_receita_colheitas: Number(totalReceitaColheitas.toFixed(2))
        });
    } catch (error) {
        console.error('Erro ao buscar KPIs agrícolas:', error);
        res.status(500).json({ error: 'Erro ao consolidar indicadores agrícolas' });
    }
});

// ==============================================================================
// 1. TALHÕES (Áreas de Plantio)
// ==============================================================================

// GET /api/agricola/talhoes - Lista talhões com quantidade de safras e safra ativa
router.get('/talhoes', (req, res) => {
    try {
        const query = `
            SELECT 
                t.*,
                (SELECT COUNT(*) FROM safras s WHERE s.talhao_id = t.id) as total_safras,
                (SELECT s.cultura FROM safras s WHERE s.talhao_id = t.id AND s.status != 'colhida' ORDER BY s.data_plantio DESC LIMIT 1) as cultura_atual,
                (SELECT s.status FROM safras s WHERE s.talhao_id = t.id AND s.status != 'colhida' ORDER BY s.data_plantio DESC LIMIT 1) as status_safra_atual,
                (SELECT s.id FROM safras s WHERE s.talhao_id = t.id AND s.status != 'colhida' ORDER BY s.data_plantio DESC LIMIT 1) as safra_atual_id
            FROM talhoes t
            ORDER BY t.nome ASC
        `;
        const talhoes = db.prepare(query).all();
        res.json(talhoes);
    } catch (error) {
        console.error('Erro ao listar talhões:', error);
        res.status(500).json({ error: 'Erro ao listar talhões' });
    }
});

// POST /api/agricola/talhoes - Cria novo talhão
router.post('/talhoes', (req, res) => {
    try {
        const { fazenda_id = 1, nome, area_hectares, tipo_solo = '' } = req.body;
        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'Nome do talhão é obrigatório' });
        }
        if (!area_hectares || Number(area_hectares) <= 0) {
            return res.status(400).json({ error: 'Área em hectares deve ser maior que zero' });
        }

        const insert = db.prepare(`
            INSERT INTO talhoes (fazenda_id, nome, area_hectares, tipo_solo)
            VALUES (?, ?, ?, ?)
        `).run(fazenda_id, nome.trim(), Number(area_hectares), tipo_solo ? tipo_solo.trim() : null);

        const newTalhao = db.prepare('SELECT * FROM talhoes WHERE id = ?').get(insert.lastInsertRowid);
        res.status(201).json(newTalhao);
    } catch (error) {
        console.error('Erro ao cadastrar talhão:', error);
        res.status(500).json({ error: 'Erro ao cadastrar talhão' });
    }
});

// PUT /api/agricola/talhoes/:id - Atualiza talhão
router.put('/talhoes/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nome, area_hectares, tipo_solo } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'Nome do talhão é obrigatório' });
        }
        if (!area_hectares || Number(area_hectares) <= 0) {
            return res.status(400).json({ error: 'Área em hectares deve ser maior que zero' });
        }

        db.prepare(`
            UPDATE talhoes 
            SET nome = ?, area_hectares = ?, tipo_solo = ?
            WHERE id = ?
        `).run(nome.trim(), Number(area_hectares), tipo_solo ? tipo_solo.trim() : null, id);

        const updated = db.prepare('SELECT * FROM talhoes WHERE id = ?').get(id);
        res.json(updated);
    } catch (error) {
        console.error('Erro ao atualizar talhão:', error);
        res.status(500).json({ error: 'Erro ao atualizar talhão' });
    }
});

// DELETE /api/agricola/talhoes/:id - Remove talhão
router.delete('/talhoes/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM talhoes WHERE id = ?').run(id);
        res.json({ message: 'Talhão excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir talhão:', error);
        res.status(500).json({ error: 'Erro ao excluir talhão' });
    }
});

// ==============================================================================
// 2. SAFRAS & CULTURAS
// ==============================================================================

// GET /api/agricola/safras - Lista safras com métricas de produtividade, custos e receitas por hectare
router.get('/safras', (req, res) => {
    try {
        const { status, talhao_id, cultura } = req.query;

        let query = `
            SELECT 
                s.*,
                t.nome as talhao_nome,
                t.area_hectares as talhao_area,
                COALESCE((SELECT SUM(i.valor) FROM insumos_agricolas i WHERE i.safra_id = s.id), 0) as total_custo_insumos,
                (SELECT COUNT(*) FROM insumos_agricolas i WHERE i.safra_id = s.id) as total_insumos_count
            FROM safras s
            JOIN talhoes t ON s.talhao_id = t.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND s.status = ?`;
            params.push(status);
        }

        if (talhao_id) {
            query += ` AND s.talhao_id = ?`;
            params.push(Number(talhao_id));
        }

        if (cultura) {
            query += ` AND s.cultura LIKE ?`;
            params.push(`%${cultura}%`);
        }

        query += ` ORDER BY s.data_plantio DESC, s.created_at DESC`;

        const safras = db.prepare(query).all(...params);

        const enriched = safras.map(s => {
            const area = s.talhao_area || 1;
            const produtividadeHa = (s.quantidade_colhida && area > 0)
                ? Number((s.quantidade_colhida / area).toFixed(2))
                : null;

            const custoPorHa = area > 0 ? Number(((s.total_custo_insumos || 0) / area).toFixed(2)) : 0;
            const receitaPorHa = (s.valor_venda_total && area > 0) ? Number((s.valor_venda_total / area).toFixed(2)) : 0;
            const lucroBruto = (s.valor_venda_total || 0) - (s.total_custo_insumos || 0);
            const lucroPorHa = area > 0 ? Number((lucroBruto / area).toFixed(2)) : 0;

            return {
                ...s,
                produtividade_ha: produtividadeHa,
                custo_por_ha: custoPorHa,
                receita_por_ha: receitaPorHa,
                lucro_bruto: lucroBruto,
                lucro_por_ha: lucroPorHa
            };
        });

        res.json(enriched);
    } catch (error) {
        console.error('Erro ao listar safras:', error);
        res.status(500).json({ error: 'Erro ao listar safras' });
    }
});

// GET /api/agricola/safras/:id - Detalhes completos da safra com insumos
router.get('/safras/:id', (req, res) => {
    try {
        const { id } = req.params;
        const safra = db.prepare(`
            SELECT 
                s.*,
                t.nome as talhao_nome,
                t.area_hectares as talhao_area
            FROM safras s
            JOIN talhoes t ON s.talhao_id = t.id
            WHERE s.id = ?
        `).get(id);

        if (!safra) {
            return res.status(404).json({ error: 'Safra não encontrada' });
        }

        const insumos = db.prepare(`
            SELECT * FROM insumos_agricolas
            WHERE safra_id = ?
            ORDER BY data DESC, created_at DESC
        `).all(id);

        const totalCustoInsumos = insumos.reduce((acc, i) => acc + i.valor, 0);
        const area = safra.talhao_area || 1;
        const produtividadeHa = (safra.quantidade_colhida && area > 0)
            ? Number((safra.quantidade_colhida / area).toFixed(2))
            : null;

        const lucroBruto = (safra.valor_venda_total || 0) - totalCustoInsumos;

        res.json({
            ...safra,
            total_custo_insumos: totalCustoInsumos,
            custo_por_ha: Number((totalCustoInsumos / area).toFixed(2)),
            receita_por_ha: Number(((safra.valor_venda_total || 0) / area).toFixed(2)),
            lucro_bruto: lucroBruto,
            lucro_por_ha: Number((lucroBruto / area).toFixed(2)),
            produtividade_ha: produtividadeHa,
            insumos
        });
    } catch (error) {
        console.error('Erro ao buscar detalhes da safra:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes da safra' });
    }
});

// POST /api/agricola/safras - Cadastra nova safra
router.post('/safras', (req, res) => {
    try {
        const {
            talhao_id,
            cultura,
            data_plantio,
            data_colheita_prevista = null,
            status = 'plantio',
            observacoes = ''
        } = req.body;

        if (!talhao_id) {
            return res.status(400).json({ error: 'Talhão é obrigatório' });
        }
        if (!cultura || !cultura.trim()) {
            return res.status(400).json({ error: 'Cultura (ex: Soja, Milho, Algodão) é obrigatória' });
        }
        if (!data_plantio) {
            return res.status(400).json({ error: 'Data de plantio é obrigatória' });
        }

        const insert = db.prepare(`
            INSERT INTO safras (
                talhao_id, cultura, data_plantio, data_colheita_prevista,
                status, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            Number(talhao_id),
            cultura.trim(),
            data_plantio,
            data_colheita_prevista || null,
            status,
            observacoes ? observacoes.trim() : null
        );

        const newSafra = db.prepare(`
            SELECT s.*, t.nome as talhao_nome, t.area_hectares as talhao_area
            FROM safras s
            JOIN talhoes t ON s.talhao_id = t.id
            WHERE s.id = ?
        `).get(insert.lastInsertRowid);

        res.status(201).json(newSafra);
    } catch (error) {
        console.error('Erro ao cadastrar safra:', error);
        res.status(500).json({ error: 'Erro ao cadastrar safra' });
    }
});

// PUT /api/agricola/safras/:id/status - Atualiza estágio da safra (plantio -> em_desenvolvimento)
router.put('/safras/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['plantio', 'em_desenvolvimento', 'colhida'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido (plantio, em_desenvolvimento, colhida)' });
        }

        db.prepare('UPDATE safras SET status = ? WHERE id = ?').run(status, id);

        const updatedSafra = db.prepare(`
            SELECT s.*, t.nome as talhao_nome, t.area_hectares as talhao_area
            FROM safras s
            JOIN talhoes t ON s.talhao_id = t.id
            WHERE s.id = ?
        `).get(id);

        res.json(updatedSafra);
    } catch (error) {
        console.error('Erro ao atualizar status da safra:', error);
        res.status(500).json({ error: 'Erro ao atualizar estágio da safra' });
    }
});

// POST /api/agricola/safras/:id/colher - Registra colheita, produtividade e gera receita financeira
router.post('/safras/:id/colher', (req, res) => {
    try {
        const { id } = req.params;
        const {
            data_colheita_real = new Date().toISOString().split('T')[0],
            quantidade_colhida,
            unidade_medida = 'sacas',
            valor_venda_total = 0,
            gerar_receita_financeira = true
        } = req.body;

        if (!quantidade_colhida || Number(quantidade_colhida) <= 0) {
            return res.status(400).json({ error: 'Quantidade colhida deve ser maior que zero' });
        }

        const executeColheita = db.transaction(() => {
            const safra = db.prepare(`
                SELECT s.*, t.nome as talhao_nome, t.area_hectares as talhao_area, t.fazenda_id
                FROM safras s
                JOIN talhoes t ON s.talhao_id = t.id
                WHERE s.id = ?
            `).get(id);

            if (!safra) {
                throw new Error('Safra não encontrada');
            }

            // 1. Atualiza safra para status 'colhida'
            db.prepare(`
                UPDATE safras SET
                    status = 'colhida',
                    data_colheita_real = ?,
                    quantidade_colhida = ?,
                    unidade_medida = ?,
                    valor_venda_total = ?
                WHERE id = ?
            `).run(
                data_colheita_real,
                Number(quantidade_colhida),
                unidade_medida,
                Number(valor_venda_total) || 0,
                id
            );

            // 2. Se houver valor de venda, gera receita no Financeiro (categoria 'venda_agricola')
            let lancamentoFin = null;
            if (gerar_receita_financeira && Number(valor_venda_total) > 0) {
                const desc = `Venda Agrícola - ${safra.cultura} (${quantidade_colhida} ${unidade_medida}, Talhão: ${safra.talhao_nome})`;
                const insertFin = db.prepare(`
                    INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
                    VALUES (?, 'receita', 'venda_agricola', ?, ?, ?)
                `).run(
                    safra.fazenda_id,
                    Number(valor_venda_total),
                    data_colheita_real,
                    desc
                );
                lancamentoFin = db.prepare('SELECT * FROM financeiro WHERE id = ?').get(insertFin.lastInsertRowid);
            }

            const updatedSafra = db.prepare(`
                SELECT s.*, t.nome as talhao_nome, t.area_hectares as talhao_area
                FROM safras s
                JOIN talhoes t ON s.talhao_id = t.id
                WHERE s.id = ?
            `).get(id);

            const produtividadeHa = (updatedSafra.quantidade_colhida && updatedSafra.talhao_area > 0)
                ? Number((updatedSafra.quantidade_colhida / updatedSafra.talhao_area).toFixed(2))
                : 0;

            return {
                safra: { ...updatedSafra, produtividade_ha: produtividadeHa },
                lancamento: lancamentoFin
            };
        });

        const result = executeColheita();
        res.json({
            message: 'Colheita registrada com sucesso!',
            ...result
        });
    } catch (error) {
        console.error('Erro ao registrar colheita:', error);
        res.status(500).json({ error: error.message || 'Erro ao registrar colheita' });
    }
});

// DELETE /api/agricola/safras/:id - Remove safra
router.delete('/safras/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM safras WHERE id = ?').run(id);
        res.json({ message: 'Safra excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir safra:', error);
        res.status(500).json({ error: 'Erro ao excluir safra' });
    }
});

// ==============================================================================
// 3. INSUMOS AGRÍCOLAS
// ==============================================================================

// GET /api/agricola/insumos - Lista insumos de uma safra
router.get('/insumos', (req, res) => {
    try {
        const { safra_id } = req.query;
        let query = `
            SELECT i.*, s.cultura as safra_cultura
            FROM insumos_agricolas i
            JOIN safras s ON i.safra_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (safra_id) {
            query += ` AND i.safra_id = ?`;
            params.push(Number(safra_id));
        }

        query += ` ORDER BY i.data DESC, i.created_at DESC`;
        const insumos = db.prepare(query).all(...params);
        res.json(insumos);
    } catch (error) {
        console.error('Erro ao listar insumos:', error);
        res.status(500).json({ error: 'Erro ao listar insumos' });
    }
});

// POST /api/agricola/insumos - Lança insumo e gera despesa no Financeiro automaticamente
router.post('/insumos', (req, res) => {
    try {
        const {
            safra_id,
            tipo,
            descricao,
            quantidade = 1,
            valor,
            data = new Date().toISOString().split('T')[0],
            gerar_despesa_financeira = true
        } = req.body;

        if (!safra_id) {
            return res.status(400).json({ error: 'Safra é obrigatória' });
        }
        if (!['semente', 'fertilizante', 'defensivo', 'outro'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo de insumo inválido (semente, fertilizante, defensivo, outro)' });
        }
        if (!descricao || !descricao.trim()) {
            return res.status(400).json({ error: 'Descrição do insumo é obrigatória' });
        }
        if (!valor || Number(valor) <= 0) {
            return res.status(400).json({ error: 'Valor do insumo deve ser maior que zero' });
        }

        const executeInsumo = db.transaction(() => {
            const safra = db.prepare(`
                SELECT s.*, t.nome as talhao_nome, t.fazenda_id
                FROM safras s
                JOIN talhoes t ON s.talhao_id = t.id
                WHERE s.id = ?
            `).get(safra_id);

            if (!safra) {
                throw new Error('Safra não encontrada');
            }

            // 1. Inserir o insumo
            const insertInsumo = db.prepare(`
                INSERT INTO insumos_agricolas (safra_id, tipo, descricao, quantidade, valor, data)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                Number(safra_id),
                tipo,
                descricao.trim(),
                Number(quantidade) || 1,
                Number(valor),
                data
            );

            // 2. Gerar despesa no Financeiro (categoria 'insumo_agricola')
            let lancamentoFin = null;
            if (gerar_despesa_financeira) {
                const desc = `Insumo Agrícola (${tipo}) - ${descricao.trim()} (Safra ${safra.cultura}, Talhão: ${safra.talhao_nome})`;
                const insertFin = db.prepare(`
                    INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
                    VALUES (?, 'despesa', 'insumo_agricola', ?, ?, ?)
                `).run(
                    safra.fazenda_id,
                    Number(valor),
                    data,
                    desc
                );
                lancamentoFin = db.prepare('SELECT * FROM financeiro WHERE id = ?').get(insertFin.lastInsertRowid);
            }

            const createdInsumo = db.prepare('SELECT * FROM insumos_agricolas WHERE id = ?').get(insertInsumo.lastInsertRowid);

            return {
                insumo: createdInsumo,
                lancamento: lancamentoFin
            };
        });

        const result = executeInsumo();
        res.status(201).json({
            message: 'Insumo lançado e despesa registrada no Financeiro!',
            ...result
        });
    } catch (error) {
        console.error('Erro ao lançar insumo:', error);
        res.status(500).json({ error: error.message || 'Erro ao lançar insumo' });
    }
});

// DELETE /api/agricola/insumos/:id - Remove insumo
router.delete('/insumos/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM insumos_agricolas WHERE id = ?').run(id);
        res.json({ message: 'Insumo excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir insumo:', error);
        res.status(500).json({ error: 'Erro ao excluir insumo' });
    }
});

export default router;
