import { Router } from 'express';
import db from '../db/database.js';
import { hashPassword, authMiddleware, requireRole } from '../utils/auth.js';

const router = Router();

// Todas as rotas de usuários requerem autenticação e papel de 'dono'
router.use(authMiddleware);
router.use(requireRole(['dono']));

// GET /api/usuarios - Lista usuários da fazenda
router.get('/', (req, res) => {
    try {
        const users = db.prepare(`
            SELECT id, fazenda_id, nome, email, papel, status, created_at
            FROM usuarios
            ORDER BY created_at ASC
        `).all();
        res.json(users);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

// POST /api/usuarios - Cadastra novo usuário
router.post('/', (req, res) => {
    try {
        const {
            fazenda_id = req.user.fazenda_id || 1,
            nome,
            email,
            senha,
            papel = 'gerente',
            status = 'ativo'
        } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'Nome do usuário é obrigatório' });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ error: 'E-mail é obrigatório' });
        }
        if (!senha || senha.length < 6) {
            return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres' });
        }
        const papeisValidos = ['dono', 'gerente', 'contador'];
        if (!papeisValidos.includes(papel)) {
            return res.status(400).json({ error: `Papel inválido. Escolha entre: ${papeisValidos.join(', ')}` });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = db.prepare('SELECT id FROM usuarios WHERE LOWER(email) = ?').get(normalizedEmail);
        if (existing) {
            return res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail' });
        }

        const senhaHash = hashPassword(senha);

        const insert = db.prepare(`
            INSERT INTO usuarios (fazenda_id, nome, email, senha_hash, papel, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            fazenda_id,
            nome.trim(),
            normalizedEmail,
            senhaHash,
            papel,
            status || 'ativo'
        );

        const newUser = db.prepare(`
            SELECT id, fazenda_id, nome, email, papel, status, created_at
            FROM usuarios WHERE id = ?
        `).get(insert.lastInsertRowid);

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// PUT /api/usuarios/:id - Atualiza usuário (papel, status, nome, senha)
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, senha, papel, status } = req.body;

        const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        if (papel) {
            const papeisValidos = ['dono', 'gerente', 'contador'];
            if (!papeisValidos.includes(papel)) {
                return res.status(400).json({ error: `Papel inválido. Escolha entre: ${papeisValidos.join(', ')}` });
            }
        }

        if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
            const existing = db.prepare('SELECT id FROM usuarios WHERE LOWER(email) = ? AND id != ?').get(email.trim().toLowerCase(), id);
            if (existing) {
                return res.status(409).json({ error: 'Este e-mail já está sendo utilizado por outro usuário' });
            }
        }

        // Impede que o próprio dono desative a si mesmo se for o único dono ativo
        if (Number(id) === req.user.id && status === 'inativo') {
            return res.status(400).json({ error: 'Você não pode desativar seu próprio usuário ativo' });
        }

        const newNome = nome !== undefined ? nome.trim() : user.nome;
        const newEmail = email !== undefined ? email.trim().toLowerCase() : user.email;
        const newPapel = papel || user.papel;
        const newStatus = status || user.status;
        const newSenhaHash = senha && senha.length >= 6 ? hashPassword(senha) : user.senha_hash;

        db.prepare(`
            UPDATE usuarios
            SET nome = ?, email = ?, senha_hash = ?, papel = ?, status = ?
            WHERE id = ?
        `).run(newNome, newEmail, newSenhaHash, newPapel, newStatus, id);

        const updated = db.prepare(`
            SELECT id, fazenda_id, nome, email, papel, status, created_at
            FROM usuarios WHERE id = ?
        `).get(id);

        res.json(updated);
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

// DELETE /api/usuarios/:id - Remove usuário
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        if (Number(id) === req.user.id) {
            return res.status(400).json({ error: 'Você não pode excluir sua própria conta conectada' });
        }

        db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
        res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
});

export default router;
