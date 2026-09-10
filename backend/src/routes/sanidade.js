import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Função auxiliar para somar dias a uma data YYYY-MM-DD
function addDays(dateStr, days) {
    if (!dateStr || !days) return null;
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + Number(days));
    return d.toISOString().split('T')[0];
}

// Função auxiliar para calcular status dinâmico e controle de carência em tempo real
function enrichSanidadeStatus(registro) {
    const today = new Date().toISOString().split('T')[0];
    
    // Janela de 7 dias para alertas preventivos
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const in7Days = d.toISOString().split('T')[0];

    let computedStatus = registro.status;

    // O status NUNCA é lido de campo fixo no banco quando pendente; é sempre avaliado contra a data de hoje
    if (registro.status !== 'aplicada') {
        const dataAlvo = registro.data_proxima_dose || registro.data_aplicacao;
        if (dataAlvo) {
            if (dataAlvo < today) {
                computedStatus = 'atrasada';
            } else if (dataAlvo <= in7Days) {
                computedStatus = 'alerta_vencendo';
            } else {
                computedStatus = 'pendente';
            }
        } else {
            computedStatus = 'pendente';
        }
    }

    // Controle de Carência Sanitária (período em que o animal não pode ser abatido/consumido)
    let sobCarencia = false;
    let diasRestantesCarencia = 0;

    if (registro.status === 'aplicada' && registro.data_fim_carencia) {
        if (registro.data_fim_carencia >= today) {
            sobCarencia = true;
            const fim = new Date(registro.data_fim_carencia + 'T00:00:00');
            const hoje = new Date(today + 'T00:00:00');
            diasRestantesCarencia = Math.max(0, Math.round((fim - hoje) / (1000 * 60 * 60 * 24)));
        }
    }

    return {
        ...registro,
        custo: Number(registro.custo) || 0,
        dias_carencia: Number(registro.dias_carencia) || 0,
        data_fim_carencia: registro.data_fim_carencia || null,
        computed_status: computedStatus,
        is_atrasada: computedStatus === 'atrasada',
        is_vencendo_7dias: computedStatus === 'alerta_vencendo',
        sob_carencia: sobCarencia,
        dias_restantes_carencia: diasRestantesCarencia
    };
}

// GET /api/sanidade/kpis - Indicadores consolidados do painel sanitário em tempo real
router.get('/kpis', (req, res) => {
    try {
        const rawList = db.prepare(`
            SELECT s.*, a.identificacao as animal_brinco
            FROM sanidade s
            LEFT JOIN animais a ON s.animal_id = a.id
        `).all();

        const enriched = rawList.map(enrichSanidadeStatus);

        const kpis = {
            total: enriched.length,
            aplicadas: enriched.filter(s => s.status === 'aplicada').length,
            pendentes: enriched.filter(s => s.computed_status === 'pendente').length,
            alerta_vencendo: enriched.filter(s => s.computed_status === 'alerta_vencendo').length,
            atrasadas: enriched.filter(s => s.computed_status === 'atrasada').length,
            sob_carencia: enriched.filter(s => s.sob_carencia).length
        };

        res.json(kpis);
    } catch (error) {
        console.error('Erro ao buscar KPIs de sanidade:', error);
        res.status(500).json({ error: 'Erro ao buscar KPIs de sanidade' });
    }
});

// GET /api/sanidade - Lista registros com filtros avançados e status recalculado
router.get('/', (req, res) => {
    try {
        const { animal_id, tipo, status_filtro, data_inicio, data_fim, busca } = req.query;

        let query = `
            SELECT 
                s.*,
                a.identificacao as animal_brinco,
                a.categoria as animal_categoria,
                p.nome as piquete_nome
            FROM sanidade s
            LEFT JOIN animais a ON s.animal_id = a.id
            LEFT JOIN piquetes p ON a.piquete_atual_id = p.id
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

        if (busca && busca.trim()) {
            query += ` AND (s.nome_produto LIKE ? OR a.identificacao LIKE ? OR s.lote_ou_grupo LIKE ? OR s.observacoes LIKE ?)`;
            const term = `%${busca.trim()}%`;
            params.push(term, term, term, term);
        }

        query += ` ORDER BY s.data_proxima_dose ASC, s.data_aplicacao DESC`;

        const rawList = db.prepare(query).all(...params);
        let list = rawList.map(enrichSanidadeStatus);

        if (status_filtro) {
            if (status_filtro === 'sob_carencia') {
                list = list.filter(item => item.sob_carencia);
            } else {
                list = list.filter(item => item.computed_status === status_filtro);
            }
        }

        res.json(list);
    } catch (error) {
        console.error('Erro ao listar sanidade:', error);
        res.status(500).json({ error: 'Erro ao listar registros de sanidade' });
    }
});

// POST /api/sanidade - Cadastra nova aplicação/agendamento com cálculo de carência e financeiro
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
            dias_carencia = 0,
            custo = 0,
            status = 'pendente',
            observacoes = '',
            gerar_lancamento_financeiro = true
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

        const diasCarenciaNum = Number(dias_carencia) || 0;
        const custoNum = Number(custo) || 0;
        let dataFimCarencia = null;

        if (status === 'aplicada' && diasCarenciaNum > 0) {
            dataFimCarencia = addDays(data_aplicacao, diasCarenciaNum);
        }

        const insert = db.prepare(`
            INSERT INTO sanidade (
                fazenda_id, animal_id, lote_ou_grupo, tipo,
                nome_produto, data_aplicacao, data_proxima_dose,
                dias_carencia, data_fim_carencia, custo, status, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            fazenda_id,
            animal_id ? Number(animal_id) : null,
            lote_ou_grupo ? lote_ou_grupo.trim() : null,
            tipo,
            nome_produto.trim(),
            data_aplicacao,
            data_proxima_dose || null,
            diasCarenciaNum,
            dataFimCarencia,
            custoNum,
            status,
            observacoes ? observacoes.trim() : null
        );

        const newId = insert.lastInsertRowid;

        // Se já foi aplicada e tem custo > 0, lança despesa no Financeiro automaticamente
        if (status === 'aplicada' && custoNum > 0 && gerar_lancamento_financeiro) {
            let desc = `Aplicação de ${nome_produto.trim()} (${tipo})`;
            if (animal_id) {
                const anim = db.prepare('SELECT identificacao FROM animais WHERE id = ?').get(animal_id);
                if (anim) desc += ` - Brinco ${anim.identificacao}`;
            } else if (lote_ou_grupo) {
                desc += ` - ${lote_ou_grupo}`;
            }

            db.prepare(`
                INSERT INTO financeiro (fazenda_id, tipo, categoria, atividade, valor, data, descricao, animal_id)
                VALUES (?, 'despesa', 'vacina_medicamento', 'pecuaria', ?, ?, ?, ?)
            `).run(fazenda_id, custoNum, data_aplicacao, desc, animal_id ? Number(animal_id) : null);
        }

        const newRegistro = db.prepare(`
            SELECT 
                s.*,
                a.identificacao as animal_brinco,
                a.categoria as animal_categoria,
                p.nome as piquete_nome
            FROM sanidade s
            LEFT JOIN animais a ON s.animal_id = a.id
            LEFT JOIN piquetes p ON a.piquete_atual_id = p.id
            WHERE s.id = ?
        `).get(newId);

        res.status(201).json(enrichSanidadeStatus(newRegistro));
    } catch (error) {
        console.error('Erro ao cadastrar sanidade:', error);
        res.status(500).json({ error: error.message || 'Erro ao cadastrar registro de sanidade' });
    }
});

// PUT /api/sanidade/:id/concluir - Marca dose como aplicada, calcula carência e gera despesa financeira
router.put('/:id/concluir', (req, res) => {
    try {
        const { id } = req.params;
        const { 
            data_aplicacao = new Date().toISOString().split('T')[0],
            custo = null,
            gerar_lancamento_financeiro = true
        } = req.body;

        const reg = db.prepare('SELECT * FROM sanidade WHERE id = ?').get(id);
        if (!reg) {
            return res.status(404).json({ error: 'Registro sanitário não encontrado' });
        }

        let dataFimCarencia = null;
        if (reg.dias_carencia > 0) {
            dataFimCarencia = addDays(data_aplicacao, reg.dias_carencia);
        }

        const custoFinal = custo !== null && custo !== undefined ? Number(custo) : (Number(reg.custo) || 0);

        db.prepare(`
            UPDATE sanidade
            SET status = 'aplicada', data_aplicacao = ?, data_fim_carencia = ?, custo = ?
            WHERE id = ?
        `).run(data_aplicacao, dataFimCarencia, custoFinal, id);

        // Lança despesa financeira se custo > 0 e solicitado
        if (custoFinal > 0 && gerar_lancamento_financeiro) {
            let desc = `Aplicação de ${reg.nome_produto} (${reg.tipo})`;
            if (reg.animal_id) {
                const anim = db.prepare('SELECT identificacao FROM animais WHERE id = ?').get(reg.animal_id);
                if (anim) desc += ` - Brinco ${anim.identificacao}`;
            } else if (reg.lote_ou_grupo) {
                desc += ` - ${reg.lote_ou_grupo}`;
            }

            db.prepare(`
                INSERT INTO financeiro (fazenda_id, tipo, categoria, atividade, valor, data, descricao, animal_id)
                VALUES (?, 'despesa', 'vacina_medicamento', 'pecuaria', ?, ?, ?, ?)
            `).run(reg.fazenda_id || 1, custoFinal, data_aplicacao, desc, reg.animal_id || null);
        }

        const updated = db.prepare(`
            SELECT 
                s.*,
                a.identificacao as animal_brinco,
                a.categoria as animal_categoria,
                p.nome as piquete_nome
            FROM sanidade s
            LEFT JOIN animais a ON s.animal_id = a.id
            LEFT JOIN piquetes p ON a.piquete_atual_id = p.id
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
