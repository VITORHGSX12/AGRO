import { Router } from 'express';
import db from '../db/database.js';
import { comparePassword, signToken, authMiddleware } from '../utils/auth.js';

const router = Router();

// POST /api/auth/login - Autenticação por e-mail e senha
router.post('/login', (req, res) => {
    try {
        const loginInput = (req.body.usuario || req.body.email || req.body.login || '').trim().toLowerCase();
        const senha = req.body.senha;

        if (!loginInput) {
            return res.status(400).json({ error: 'Usuário ou e-mail é obrigatório' });
        }
        if (!senha) {
            return res.status(400).json({ error: 'Senha é obrigatória' });
        }

        const user = db.prepare(`
            SELECT * FROM usuarios 
            WHERE LOWER(email) = ? 
               OR LOWER(email) = ? 
               OR LOWER(nome) = ?
               OR LOWER(email) LIKE ?
        `).get(loginInput, `${loginInput}@agro.com`, loginInput, `${loginInput}%`);

        if (!user) {
            return res.status(401).json({ error: 'Usuário/e-mail ou senha inválidos' });
        }

        if (user.status !== 'ativo') {
            return res.status(403).json({ error: 'Este usuário está inativo. Entre em contato com o administrador.' });
        }

        const senhaValida = comparePassword(senha, user.senha_hash);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Usuário/e-mail ou senha inválidos' });
        }

        // Gera token JWT (válido por 7 dias)
        const payload = {
            id: user.id,
            nome: user.nome,
            email: user.email,
            papel: user.papel,
            fazenda_id: user.fazenda_id
        };

        const token = signToken(payload);

        res.json({
            message: 'Login realizado com sucesso!',
            token,
            user: payload
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno ao realizar login' });
    }
});

// GET /api/auth/me - Retorna os dados do usuário autenticado
router.get('/me', authMiddleware, (req, res) => {
    try {
        const user = db.prepare('SELECT id, fazenda_id, nome, email, papel, status, created_at FROM usuarios WHERE id = ?').get(req.user.id);
        if (!user || user.status !== 'ativo') {
            return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
        }
        res.json(user);
    } catch (error) {
        console.error('Erro ao buscar dados do usuário atual:', error);
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
});

export default router;
