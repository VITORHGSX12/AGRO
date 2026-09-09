import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Função auxiliar para calcular status dinâmico com base na data de hoje
function enrichSanidadeStatus(registro) {
    const today = new Date().toISOString().split('T')[0];
    
    // Calcula prazo de 7 dias
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const in7Days = d.toISOString().split('T')[0];

    let computedStatus = registro.status;

    if (registro.status !== 'aplicada') {
        if (registro.data_proxima_dose) {
            if (registro.data_proxima_dose < today) {
                computedStatus = 'atrasada';
            } else if (registro.data_proxima_dose <= in7Days) {
                computedStatus = 'alerta_vencendo';
            } else {
                computedStatus = 'pendente';
            }
        }
    }

    return {
        ...registro,
        computed_status: computedStatus,
        is_atrasada: computedStatus === 'atrasada',
        is_vencendo_7dias: computedStatus === 'alerta_vencendo'
    };
}

// GET /api/sanidade - Lista registros de sanidade com cálculo dinâmico de vencimento
router.get('/', (req, res) => {
    try {
        const { animal_id, tipo, status_filtro, data_inicio, data_fim } = req.query;

        let query = `
            SELECT 
                s.*,
                a.identificacao as animal_brinco,
                a.categoria as animal_categoria
            FROM sanidade s
            LEFT JOIN animais a ON s.animal_id = a.id
            WHERE 1=1
        `;
        const params = [];

        if (animal_id) {
            query += ` AND s.animal_id = ?`;
            params.push(Number(animal_id));
        }

        if (tipo) {
            query += ` AND s.tipo = ?`;
            params.push(tipo);
        }

        if (data_inicio) {
            query += ` AND (s.data_aplicacao >= ? OR s.data_proxima_dose >= ?)`;
            params.push(data_inicio, data_inicio);
        }

        if (data_fim) {
            query += ` AND (s.data_aplicacao <= ? OR s.data_proxima_dose <= ?)`;
            params.push(data_fim, data_fim);
        }

        query += ` ORDER BY s.data_proxima_dose ASC, s.data_aplicacao DESC`;

        const rawList = db.prepare(query).all(...params);
        let list = rawList.map(enrichSanidadeStatus);

        if (status_filtro) {
            list = list.filter(item => item.computed_status === status_filtro);
        }

        res.json(list);
    } catch (error) {
        console.error('Erro ao listar sanidade:', error);
        res.status(500).json({ error: 'Erro ao listar registros de sanidade' });
    }
});

// POST /api/sanidade - Cadastra nova aplicação/agendamento de sanidade
router.post('/', (req, res) => {
    try {
        const {
            fazenda_id = 1,
            animal_id = null,
            lote_ou_grupo = null,
            tipo,
            nome_produto,
            data_aplicacao,
            data_proxima_dose = null,
            status = 'pendente',
            observacoes = ''
        } = req.body;

        if (!tipo) {
            return res.status(400).json({ error: 'Tipo (vacina/vermifugo/tratamento) é obrigatório' });
        }

        if (!nome_produto || !nome_produto.trim()) {
            return res.status(400).json({ error: 'Nome do produto / vacina é obrigatório' });
        }

        if (!data_aplicacao) {
            return res.status(400).json({ error: 'Data de aplicação é obrigatória' });
        }

        const insert = db.prepare(`
            INSERT INTO sanidade (
                fazenda_id, animal_id, lote_ou_grupo, tipo,
                nome_produto, data_aplicacao, data_proxima_dose, status, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            fazenda_id,
            animal_id ? Number(animal_id) : null,
            lote_ou_grupo ? lote_ou_grupo.trim() : null,
            tipo,
            nome_produto.trim(),
            data_aplicacao,
            data_proxima_dose || null,
            status,
            observacoes ? observacoes.trim() : null
        );

        const newRegistro = db.prepare(`
            SELECT 
                s.*,
                a.identificacao as animal_brinco,
                a.categoria as animal_categoria
            FROM sanidade s
            LEFT JOIN animais a ON s.animal_id = a.id
            WHERE s.id = ?
        `).get(insert.lastInsertRowid);

        res.status(201).json(enrichSanidadeStatus(newRegistro));
    } catch (error) {
        console.error('Erro ao cadastrar sanidade:', error);
        res.status(500).json({ error: 'Erro ao cadastrar registro de sanidade' });
    }
});

// PUT /api/sanidade/:id/concluir - Marca dose como aplicada
router.put('/:id/concluir', (req, res) => {
    try {
        const { id } = req.params;
        const { data_aplicacao = new Date().toISOString().split('T')[0] } = req.body;

        db.prepare(`
            UPDATE sanidade
            SET status = 'aplicada', data_aplicacao = ?
            WHERE id = ?
        `).run(data_aplicacao, id);

        const updated = db.prepare(`
            SELECT 
                s.*,
                a.identificacao as animal_brinco,
                a.categoria as animal_categoria
            FROM sanidade s
            LEFT JOIN animais a ON s.animal_id = a.id
            WHERE s.id = ?
        `).get(id);

        res.json(enrichSanidadeStatus(updated));
    } catch (error) {
        console.error('Erro ao concluir sanidade:', error);
        res.status(500).json({ error: 'Erro ao atualizar status de sanidade' });
    }
});

// DELETE /api/sanidade/:id - Exclui registro de sanidade
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM sanidade WHERE id = ?').run(id);
        res.json({ message: 'Registro de sanidade excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir sanidade:', error);
        res.status(500).json({ error: 'Erro ao excluir registro de sanidade' });
    }
});

export default router;
