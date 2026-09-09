import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/animais - Lista animais com filtros avançados
router.get('/', (req, res) => {
    try {
        const { status, categoria, piquete_id, busca } = req.query;

        let query = `
            SELECT 
                a.*,
                p.nome as piquete_nome
            FROM animais a
            LEFT JOIN piquetes p ON a.piquete_atual_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND a.status = ?`;
            params.push(status);
        }

        if (categoria) {
            query += ` AND a.categoria = ?`;
            params.push(categoria);
        }

        if (piquete_id) {
            query += ` AND a.piquete_atual_id = ?`;
            params.push(Number(piquete_id));
        }

        if (busca && busca.trim()) {
            query += ` AND (a.identificacao LIKE ? OR a.raca LIKE ? OR a.observacoes LIKE ?)`;
            const term = `%${busca.trim()}%`;
            params.push(term, term, term);
        }

        query += ` ORDER BY a.created_at DESC`;

        const animais = db.prepare(query).all(...params);
        res.json(animais);
    } catch (error) {
        console.error('Erro ao buscar animais:', error);
        res.status(500).json({ error: 'Erro ao listar animais' });
    }
});

// GET /api/animais/:id - Detalhes do animal, histórico de movimentações e sanidade
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;

        const animal = db.prepare(`
            SELECT 
                a.*,
                p.nome as piquete_nome
            FROM animais a
            LEFT JOIN piquetes p ON a.piquete_atual_id = p.id
            WHERE a.id = ?
        `).get(id);

        if (!animal) {
            return res.status(404).json({ error: 'Animal não encontrado' });
        }

        const movimentacoes = db.prepare(`
            SELECT 
                m.*,
                po.nome as piquete_origem_nome,
                pd.nome as piquete_destino_nome
            FROM movimentacoes_animais m
            LEFT JOIN piquetes po ON m.piquete_origem_id = po.id
            LEFT JOIN piquetes pd ON m.piquete_destino_id = pd.id
            WHERE m.animal_id = ?
            ORDER BY m.data DESC, m.created_at DESC
        `).all(id);

        const sanidade = db.prepare(`
            SELECT * FROM sanidade
            WHERE animal_id = ? OR animal_id IS NULL
            ORDER BY data_aplicacao DESC
        `).all(id);

        res.json({
            ...animal,
            movimentacoes,
            sanidade
        });
    } catch (error) {
        console.error('Erro ao buscar detalhes do animal:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes do animal' });
    }
});

// POST /api/animais - Cadastra novo animal
router.post('/', (req, res) => {
    try {
        const {
            fazenda_id = 1,
            identificacao,
            sexo,
            data_nascimento,
            raca,
            categoria,
            status = 'ativo',
            piquete_atual_id = null,
            peso_atual = null,
            observacoes = ''
        } = req.body;

        if (!identificacao || !identificacao.trim()) {
            return res.status(400).json({ error: 'Identificação (brinco) é obrigatória' });
        }

        if (!['M', 'F'].includes(sexo)) {
            return res.status(400).json({ error: 'Sexo inválido. Escolha M ou F.' });
        }

        const validCategorias = ['bezerro', 'bezerra', 'novilha', 'novilho', 'vaca', 'touro', 'garrote', 'boi_gordo', 'outro'];
        if (!validCategorias.includes(categoria)) {
            return res.status(400).json({ error: `Categoria inválida. Opções: ${validCategorias.join(', ')}` });
        }

        // Verifica duplicidade de brinco dentro da mesma fazenda
        const existing = db.prepare('SELECT id FROM animais WHERE fazenda_id = ? AND identificacao = ?').get(fazenda_id, identificacao.trim());
        if (existing) {
            return res.status(400).json({ error: `Já existe um animal com o brinco "${identificacao}" cadastrado nesta fazenda` });
        }

        const insert = db.prepare(`
            INSERT INTO animais (
                fazenda_id, identificacao, sexo, data_nascimento, raca,
                categoria, status, piquete_atual_id, peso_atual, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            fazenda_id,
            identificacao.trim(),
            sexo,
            data_nascimento || null,
            raca ? raca.trim() : null,
            categoria,
            status,
            piquete_atual_id ? Number(piquete_atual_id) : null,
            peso_atual ? Number(peso_atual) : null,
            observacoes ? observacoes.trim() : null
        );

        const newAnimal = db.prepare(`
            SELECT a.*, p.nome as piquete_nome
            FROM animais a
            LEFT JOIN piquetes p ON a.piquete_atual_id = p.id
            WHERE a.id = ?
        `).get(insert.lastInsertRowid);

        res.status(201).json(newAnimal);
    } catch (error) {
        console.error('Erro ao cadastrar animal:', error);
        res.status(500).json({ error: error.message || 'Erro ao cadastrar animal' });
    }
});

// PUT /api/animais/:id - Atualiza dados do animal
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const {
            identificacao,
            sexo,
            data_nascimento,
            raca,
            categoria,
            status,
            piquete_atual_id,
            peso_atual,
            observacoes
        } = req.body;

        const animal = db.prepare('SELECT * FROM animais WHERE id = ?').get(id);
        if (!animal) {
            return res.status(404).json({ error: 'Animal não encontrado' });
        }

        if (identificacao && identificacao.trim() !== animal.identificacao) {
            const existing = db.prepare('SELECT id FROM animais WHERE identificacao = ? AND id != ?').get(identificacao.trim(), id);
            if (existing) {
                return res.status(400).json({ error: `Já existe outro animal com o brinco "${identificacao}"` });
            }
        }

        db.prepare(`
            UPDATE animais SET
                identificacao = COALESCE(?, identificacao),
                sexo = COALESCE(?, sexo),
                data_nascimento = ?,
                raca = ?,
                categoria = COALESCE(?, categoria),
                status = COALESCE(?, status),
                piquete_atual_id = ?,
                peso_atual = ?,
                observacoes = ?
            WHERE id = ?
        `).run(
            identificacao ? identificacao.trim() : null,
            sexo || null,
            data_nascimento !== undefined ? data_nascimento : animal.data_nascimento,
            raca !== undefined ? (raca ? raca.trim() : null) : animal.raca,
            categoria || null,
            status || null,
            piquete_atual_id !== undefined ? (piquete_atual_id ? Number(piquete_atual_id) : null) : animal.piquete_atual_id,
            peso_atual !== undefined ? (peso_atual ? Number(peso_atual) : null) : animal.peso_atual,
            observacoes !== undefined ? (observacoes ? observacoes.trim() : null) : animal.observacoes,
            id
        );

        const updated = db.prepare(`
            SELECT a.*, p.nome as piquete_nome
            FROM animais a
            LEFT JOIN piquetes p ON a.piquete_atual_id = p.id
            WHERE a.id = ?
        `).get(id);

        res.json(updated);
    } catch (error) {
        console.error('Erro ao atualizar animal:', error);
        res.status(500).json({ error: 'Erro ao atualizar animal' });
    }
});

// DELETE /api/animais/:id - Remove animal
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM animais WHERE id = ?').run(id);
        res.json({ message: 'Animal excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir animal:', error);
        res.status(500).json({ error: 'Erro ao excluir animal' });
    }
});

export default router;
