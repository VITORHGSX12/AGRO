import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/fazenda - Retorna os dados da fazenda (cria padrão se não existir)
router.get('/', (req, res) => {
    try {
        let fazenda = db.prepare('SELECT * FROM fazenda ORDER BY id ASC LIMIT 1').get();
        if (!fazenda) {
            const result = db.prepare(`
                INSERT INTO fazenda (nome, area_hectares, localizacao)
                VALUES ('Minha Fazenda', 500, 'Brasil')
            `).run();
            fazenda = db.prepare('SELECT * FROM fazenda WHERE id = ?').get(result.lastInsertRowid);
        }
        res.json(fazenda);
    } catch (error) {
        console.error('Erro ao buscar fazenda:', error);
        res.status(500).json({ error: 'Erro ao buscar dados da fazenda' });
    }
});

// PUT /api/fazenda - Atualiza informações da fazenda
router.put('/', (req, res) => {
    try {
        const { nome, area_hectares, localizacao } = req.body;
        let fazenda = db.prepare('SELECT id FROM fazenda ORDER BY id ASC LIMIT 1').get();
        
        if (!fazenda) {
            const insert = db.prepare(`
                INSERT INTO fazenda (nome, area_hectares, localizacao)
                VALUES (?, ?, ?)
            `).run(nome, area_hectares || 0, localizacao || '');
            fazenda = { id: insert.lastInsertRowid };
        } else {
            db.prepare(`
                UPDATE fazenda
                SET nome = ?, area_hectares = ?, localizacao = ?
                WHERE id = ?
            `).run(nome, area_hectares || 0, localizacao || '', fazenda.id);
        }

        const updated = db.prepare('SELECT * FROM fazenda WHERE id = ?').get(fazenda.id);
        res.json(updated);
    } catch (error) {
        console.error('Erro ao atualizar fazenda:', error);
        res.status(500).json({ error: 'Erro ao atualizar fazenda' });
    }
});

export default router;
