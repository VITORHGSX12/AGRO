import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/piquetes - Lista todos os piquetes com a contagem atual de animais
router.get('/', (req, res) => {
    try {
        const query = `
            SELECT 
                p.*,
                COUNT(CASE WHEN a.status = 'ativo' THEN 1 END) as total_animais_ativos
            FROM piquetes p
            LEFT JOIN animais a ON a.piquete_atual_id = p.id
            GROUP BY p.id
            ORDER BY p.nome ASC
        `;
        const piquetes = db.prepare(query).all();
        res.json(piquetes);
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
        res.status(201).json(newPiquete);
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

        const updated = db.prepare('SELECT * FROM piquetes WHERE id = ?').get(id);
        res.json(updated);
    } catch (error) {
        console.error('Erro ao atualizar piquete:', error);
        res.status(500).json({ error: 'Erro ao atualizar piquete' });
    }
});

// DELETE /api/piquetes/:id - Remove piquete
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM piquetes WHERE id = ?').run(id);
        res.json({ message: 'Piquete excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir piquete:', error);
        res.status(500).json({ error: 'Erro ao excluir piquete' });
    }
});

export default router;
