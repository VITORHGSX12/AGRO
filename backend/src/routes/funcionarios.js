import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/funcionarios - Lista colaboradores
router.get('/', (req, res) => {
    try {
        const { status, tipo_contratacao } = req.query;

        let query = `SELECT * FROM funcionarios WHERE 1=1`;
        const params = [];

        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }

        if (tipo_contratacao) {
            query += ` AND tipo_contratacao = ?`;
            params.push(tipo_contratacao);
        }

        query += ` ORDER BY status ASC, nome ASC`;

        const funcionarios = db.prepare(query).all(...params);
        res.json(funcionarios);
    } catch (error) {
        console.error('Erro ao listar funcionários:', error);
        res.status(500).json({ error: 'Erro ao listar funcionários' });
    }
});

// POST /api/funcionarios - Cadastra novo colaborador
router.post('/', (req, res) => {
    try {
        const {
            fazenda_id = 1,
            nome,
            funcao,
            tipo_contratacao = 'fixo',
            salario = 0,
            valor_diaria = 0,
            mora_na_fazenda = 0,
            data_admissao,
            status = 'ativo'
        } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'Nome do funcionário é obrigatório' });
        }

        if (!['fixo', 'diarista'].includes(tipo_contratacao)) {
            return res.status(400).json({ error: 'Tipo de contratação deve ser "fixo" ou "diarista"' });
        }

        const insert = db.prepare(`
            INSERT INTO funcionarios (
                fazenda_id, nome, funcao, tipo_contratacao, salario,
                valor_diaria, mora_na_fazenda, data_admissao, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            fazenda_id,
            nome.trim(),
            funcao ? funcao.trim() : 'Colaborador',
            tipo_contratacao,
            tipo_contratacao === 'fixo' ? (Number(salario) || 0) : 0,
            tipo_contratacao === 'diarista' ? (Number(valor_diaria) || 0) : 0,
            mora_na_fazenda ? 1 : 0,
            data_admissao || new Date().toISOString().split('T')[0],
            status
        );

        const newFuncionario = db.prepare('SELECT * FROM funcionarios WHERE id = ?').get(insert.lastInsertRowid);
        res.status(201).json(newFuncionario);
    } catch (error) {
        console.error('Erro ao cadastrar funcionário:', error);
        res.status(500).json({ error: 'Erro ao cadastrar funcionário' });
    }
});

// PUT /api/funcionarios/:id - Atualiza dados do colaborador
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome,
            funcao,
            tipo_contratacao,
            salario,
            valor_diaria,
            mora_na_fazenda,
            data_admissao,
            data_desligamento,
            status
        } = req.body;

        const funcionario = db.prepare('SELECT * FROM funcionarios WHERE id = ?').get(id);
        if (!funcionario) {
            return res.status(404).json({ error: 'Funcionário não encontrado' });
        }

        db.prepare(`
            UPDATE funcionarios SET
                nome = COALESCE(?, nome),
                funcao = COALESCE(?, funcao),
                tipo_contratacao = COALESCE(?, tipo_contratacao),
                salario = ?,
                valor_diaria = ?,
                mora_na_fazenda = ?,
                data_admissao = COALESCE(?, data_admissao),
                data_desligamento = ?,
                status = COALESCE(?, status)
            WHERE id = ?
        `).run(
            nome ? nome.trim() : null,
            funcao ? funcao.trim() : null,
            tipo_contratacao || null,
            tipo_contratacao === 'fixo' ? (Number(salario) || 0) : (salario !== undefined ? Number(salario) : funcionario.salario),
            tipo_contratacao === 'diarista' ? (Number(valor_diaria) || 0) : (valor_diaria !== undefined ? Number(valor_diaria) : funcionario.valor_diaria),
            mora_na_fazenda !== undefined ? (mora_na_fazenda ? 1 : 0) : funcionario.mora_na_fazenda,
            data_admissao || null,
            status === 'desligado' ? (data_desligamento || new Date().toISOString().split('T')[0]) : null,
            status || null,
            id
        );

        const updated = db.prepare('SELECT * FROM funcionarios WHERE id = ?').get(id);
        res.json(updated);
    } catch (error) {
        console.error('Erro ao atualizar funcionário:', error);
        res.status(500).json({ error: 'Erro ao atualizar funcionário' });
    }
});

// DELETE /api/funcionarios/:id - Remove colaborador
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM funcionarios WHERE id = ?').run(id);
        res.json({ message: 'Funcionário excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        res.status(500).json({ error: 'Erro ao excluir funcionário' });
    }
});

export default router;
