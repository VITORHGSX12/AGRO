import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/piquetes - Lista todos os piquetes com métricas completas e animais alocados
router.get('/', (req, res) => {
    try {
        const piquetes = db.prepare(`
            SELECT 
                p.*,
                COUNT(CASE WHEN a.status = 'ativo' THEN 1 END) as total_animais_ativos
            FROM piquetes p
            LEFT JOIN animais a ON a.piquete_atual_id = p.id
            GROUP BY p.id
            ORDER BY p.nome ASC
        `).all();

        const animaisAtivos = db.prepare(`
            SELECT id, fazenda_id, identificacao, sexo, raca, categoria, status, peso_atual, piquete_atual_id
            FROM animais
            WHERE status = 'ativo' AND piquete_atual_id IS NOT NULL
        `).all();

        const enriched = piquetes.map(p => {
            const cap = p.capacidade_suporte || 0;
            const total = p.total_animais_ativos || 0;
            const taxa = cap > 0 ? Number(((total / cap) * 100).toFixed(1)) : 0;
            const densidade = p.tamanho_hectares > 0 ? Number((total / p.tamanho_hectares).toFixed(2)) : 0;

            let statusOcupacao = 'normal';
            if (taxa > 100) statusOcupacao = 'superlotado';
            else if (taxa >= 80) statusOcupacao = 'alerta';

            const animaisNestePiquete = animaisAtivos.filter(a => a.piquete_atual_id === p.id);

            return {
                ...p,
                taxa_ocupacao_pct: taxa,
                densidade_cab_ha: densidade,
                status_ocupacao: statusOcupacao,
                animais: animaisNestePiquete
            };
        });

        res.json(enriched);
    } catch (error) {
        console.error('Erro ao buscar piquetes:', error);
        res.status(500).json({ error: 'Erro ao buscar piquetes' });
    }
});

// GET /api/piquetes/:id/rotacao - Histórico de rotação / linha do tempo do piquete
router.get('/:id/rotacao', (req, res) => {
    try {
        const { id } = req.params;
        const historico = db.prepare(`
            SELECT * FROM rotacao_pastagem
            WHERE piquete_id = ?
            ORDER BY data_entrada DESC, id DESC
        `).all(id);

        res.json(historico);
    } catch (error) {
        console.error('Erro ao buscar histórico de rotação:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico de rotação' });
    }
});

// POST /api/piquetes/:id/rotacao - Registra entrada/saída de lote ou descanso do piquete
router.post('/:id/rotacao', (req, res) => {
    try {
        const { id } = req.params;
        const { data_entrada, data_saida = null, quantidade_animais = 1, observacao = '' } = req.body;

        if (!data_entrada) {
            return res.status(400).json({ error: 'Data de entrada é obrigatória' });
        }

        const insert = db.prepare(`
            INSERT INTO rotacao_pastagem (piquete_id, data_entrada, data_saida, quantidade_animais, observacao)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, data_entrada, data_saida || null, Number(quantidade_animais) || 1, observacao ? observacao.trim() : null);

        const newRot = db.prepare('SELECT * FROM rotacao_pastagem WHERE id = ?').get(insert.lastInsertRowid);
        res.status(201).json(newRot);
    } catch (error) {
        console.error('Erro ao registrar rotação de pastagem:', error);
        res.status(500).json({ error: 'Erro ao registrar rotação de pastagem' });
    }
});

// POST /api/piquetes - Cria um novo piquete
router.post('/', (req, res) => {
    try {
        const { fazenda_id = 1, nome, tamanho_hectares = 0, capacidade_suporte = 0 } = req.body;
        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'Nome do piquete é obrigatório' });
        }

        const insert = db.prepare(`
            INSERT INTO piquetes (fazenda_id, nome, tamanho_hectares, capacidade_suporte)
            VALUES (?, ?, ?, ?)
        `).run(fazenda_id, nome.trim(), Number(tamanho_hectares) || 0, Number(capacidade_suporte) || 0);

        const newPiquete = db.prepare('SELECT * FROM piquetes WHERE id = ?').get(insert.lastInsertRowid);
        res.status(201).json({
            ...newPiquete,
            total_animais_ativos: 0,
            taxa_ocupacao_pct: 0,
            densidade_cab_ha: 0,
            status_ocupacao: 'normal',
            animais: []
        });
    } catch (error) {
        console.error('Erro ao cadastrar piquete:', error);
        res.status(500).json({ error: 'Erro ao cadastrar piquete' });
    }
});

// PUT /api/piquetes/:id - Atualiza piquete
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nome, tamanho_hectares, capacidade_suporte } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'Nome do piquete é obrigatório' });
        }

        db.prepare(`
            UPDATE piquetes
            SET nome = ?, tamanho_hectares = ?, capacidade_suporte = ?
            WHERE id = ?
        `).run(nome.trim(), Number(tamanho_hectares) || 0, Number(capacidade_suporte) || 0, id);

        const updated = db.prepare(`
            SELECT 
                p.*,
                COUNT(CASE WHEN a.status = 'ativo' THEN 1 END) as total_animais_ativos
            FROM piquetes p
            LEFT JOIN animais a ON a.piquete_atual_id = p.id
            WHERE p.id = ?
            GROUP BY p.id
        `).get(id);

        const cap = updated.capacidade_suporte || 0;
        const total = updated.total_animais_ativos || 0;
        const taxa = cap > 0 ? Number(((total / cap) * 100).toFixed(1)) : 0;
        const densidade = updated.tamanho_hectares > 0 ? Number((total / updated.tamanho_hectares).toFixed(2)) : 0;

        res.json({
            ...updated,
            taxa_ocupacao_pct: taxa,
            densidade_cab_ha: densidade,
            status_ocupacao: taxa > 100 ? 'superlotado' : (taxa >= 80 ? 'alerta' : 'normal')
        });
    } catch (error) {
        console.error('Erro ao atualizar piquete:', error);
        res.status(500).json({ error: 'Erro ao atualizar piquete' });
    }
});

// DELETE /api/piquetes/:id - Remove piquete e desassocia animais
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('UPDATE animais SET piquete_atual_id = NULL WHERE piquete_atual_id = ?').run(id);
        db.prepare('DELETE FROM rotacao_pastagem WHERE piquete_id = ?').run(id);
        db.prepare('DELETE FROM piquetes WHERE id = ?').run(id);
        res.json({ message: 'Piquete excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir piquete:', error);
        res.status(500).json({ error: 'Erro ao excluir piquete' });
    }
});

export default router;
