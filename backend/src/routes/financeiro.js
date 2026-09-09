import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

export const CATEGORIAS_VALIDAS = [
    'venda_animal',
    'compra_animal',
    'venda_agricola',
    'insumo_agricola',
    'vacina_medicamento',
    'nutricao_racao',
    'salario',
    'aluguel_pasto',
    'aluguel_pasto_pago',
    'aluguel_pasto_recebido',
    'manutencao_infra',
    'manutencao_maquina',
    'combustivel',
    'servicos_terceiros',
    'outros'
];

// GET /api/financeiro - Lista lançamentos com filtros
router.get('/', (req, res) => {
    try {
        const { tipo, categoria, mes_ano, data_inicio, data_fim } = req.query;

        let query = `
            SELECT 
                f.*,
                a.identificacao as animal_brinco
            FROM financeiro f
            LEFT JOIN animais a ON f.animal_id = a.id
            WHERE 1=1
        `;
        const params = [];

        if (tipo) {
            query += ` AND f.tipo = ?`;
            params.push(tipo);
        }

        if (categoria) {
            query += ` AND f.categoria = ?`;
            params.push(categoria);
        }

        if (mes_ano) {
            // Formato esperado 'YYYY-MM'
            query += ` AND f.data LIKE ?`;
            params.push(`${mes_ano}%`);
        }

        if (data_inicio) {
            query += ` AND f.data >= ?`;
            params.push(data_inicio);
        }

        if (data_fim) {
            query += ` AND f.data <= ?`;
            params.push(data_fim);
        }

        query += ` ORDER BY f.data DESC, f.created_at DESC`;

        const lancamentos = db.prepare(query).all(...params);
        res.json(lancamentos);
    } catch (error) {
        console.error('Erro ao listar lançamentos financeiros:', error);
        res.status(500).json({ error: 'Erro ao listar lançamentos financeiros' });
    }
});

// GET /api/financeiro/resumo - Resumo consolidado de receitas, despesas e saldo
router.get('/resumo', (req, res) => {
    try {
        const { mes_ano } = req.query;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (mes_ano) {
            whereClause += ' AND data LIKE ?';
            params.push(`${mes_ano}%`);
        }

        const stats = db.prepare(`
            SELECT
                COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as total_receitas,
                COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as total_despesas
            FROM financeiro
            ${whereClause}
        `).get(...params);

        const totalReceitas = stats.total_receitas;
        const totalDespesas = stats.total_despesas;
        const saldo = totalReceitas - totalDespesas;

        // Despesas por categoria para gráficos
        const porCategoria = db.prepare(`
            SELECT 
                categoria,
                tipo,
                SUM(valor) as total
            FROM financeiro
            ${whereClause}
            GROUP BY categoria, tipo
            ORDER BY total DESC
        `).all(...params);

        res.json({
            total_receitas: totalReceitas,
            total_despesas: totalDespesas,
            saldo: saldo,
            detalhe_categorias: porCategoria
        });
    } catch (error) {
        console.error('Erro ao buscar resumo financeiro:', error);
        res.status(500).json({ error: 'Erro ao calcular resumo financeiro' });
    }
});

// POST /api/financeiro - Cria novo lançamento
router.post('/', (req, res) => {
    try {
        const {
            fazenda_id = 1,
            tipo,
            categoria,
            valor,
            data,
            descricao = '',
            animal_id = null
        } = req.body;

        if (!['receita', 'despesa'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo deve ser "receita" ou "despesa"' });
        }

        if (!categoria || !CATEGORIAS_VALIDAS.includes(categoria)) {
            return res.status(400).json({
                error: `Categoria obrigatória e inválida. Escolha entre: ${CATEGORIAS_VALIDAS.join(', ')}`
            });
        }

        if (valor === undefined || valor === null || Number(valor) <= 0) {
            return res.status(400).json({ error: 'Valor deve ser um número positivo maior que zero' });
        }

        if (!data) {
            return res.status(400).json({ error: 'Data do lançamento é obrigatória' });
        }

        const insert = db.prepare(`
            INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao, animal_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            fazenda_id,
            tipo,
            categoria,
            Number(valor),
            data,
            descricao ? descricao.trim() : null,
            animal_id ? Number(animal_id) : null
        );

        const newLancamento = db.prepare(`
            SELECT 
                f.*,
                a.identificacao as animal_brinco
            FROM financeiro f
            LEFT JOIN animais a ON f.animal_id = a.id
            WHERE f.id = ?
        `).get(insert.lastInsertRowid);

        res.status(201).json(newLancamento);
    } catch (error) {
        console.error('Erro ao criar lançamento financeiro:', error);
        res.status(500).json({ error: 'Erro ao criar lançamento financeiro' });
    }
});

// DELETE /api/financeiro/:id - Remove lançamento
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM financeiro WHERE id = ?').run(id);
        res.json({ message: 'Lançamento financeiro excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir lançamento financeiro:', error);
        res.status(500).json({ error: 'Erro ao excluir lançamento financeiro' });
    }
});

export default router;
