import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Função auxiliar para calcular depreciação linear simples
function calcularDepreciacao(valorAquisicao, dataAquisicao, vidaUtilAnos) {
    const valAq = Number(valorAquisicao) || 0;
    const vidaUtil = Number(vidaUtilAnos) || 1;

    if (!dataAquisicao || valAq <= 0 || vidaUtil <= 0) {
        return {
            depreciacao_anual: 0,
            anos_decorridos: 0,
            depreciacao_acumulada: 0,
            valor_atual: valAq,
            percentual_depreciado: 0
        };
    }

    const agora = new Date();
    const aquisicao = new Date(dataAquisicao);
    
    // Anos decorridos com precisão decimal
    const diffMs = agora - aquisicao;
    const anosDecorridos = Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 365.25));

    const depreciacaoAnual = valAq / vidaUtil;
    const depreciacaoAcumulada = Math.min(valAq, Math.max(0, anosDecorridos * depreciacaoAnual));
    const valorAtual = Math.max(0, valAq - depreciacaoAcumulada);
    const percentualDepreciado = Math.min(100, Math.max(0, (depreciacaoAcumulada / valAq) * 100));

    return {
        depreciacao_anual: Number(depreciacaoAnual.toFixed(2)),
        anos_decorridos: Number(anosDecorridos.toFixed(2)),
        depreciacao_acumulada: Number(depreciacaoAcumulada.toFixed(2)),
        valor_atual: Number(valorAtual.toFixed(2)),
        percentual_depreciado: Number(percentualDepreciado.toFixed(1))
    };
}

// ==============================================================================
// 1. RESUMO CONSOLIDADO DO PATRIMÔNIO
// ==============================================================================

// GET /api/patrimonio/resumo - Totais de patrimônio, depreciação e manutenções
router.get('/resumo', (req, res) => {
    try {
        const benfeitorias = db.prepare('SELECT * FROM benfeitorias').all();
        const maquinas = db.prepare('SELECT * FROM maquinas_equipamentos WHERE status != "vendido"').all();
        const totalManutencoes = db.prepare('SELECT COALESCE(SUM(valor), 0) as total, COUNT(*) as count FROM manutencoes').get();

        let totalAquisicaoBenfeitorias = 0;
        let totalAtualBenfeitorias = 0;
        let totalDepreciadoBenfeitorias = 0;

        benfeitorias.forEach(b => {
            const dep = calcularDepreciacao(b.valor_aquisicao, b.data_aquisicao, b.vida_util_anos);
            totalAquisicaoBenfeitorias += b.valor_aquisicao;
            totalAtualBenfeitorias += dep.valor_atual;
            totalDepreciadoBenfeitorias += dep.depreciacao_acumulada;
        });

        let totalAquisicaoMaquinas = 0;
        let totalAtualMaquinas = 0;
        let totalDepreciadoMaquinas = 0;

        maquinas.forEach(m => {
            const dep = calcularDepreciacao(m.valor_aquisicao, m.data_aquisicao, m.vida_util_anos);
            totalAquisicaoMaquinas += m.valor_aquisicao;
            totalAtualMaquinas += dep.valor_atual;
            totalDepreciadoMaquinas += dep.depreciacao_acumulada;
        });

        const totalPatrimonialAtual = totalAtualBenfeitorias + totalAtualMaquinas;
        const totalAquisicaoGeral = totalAquisicaoBenfeitorias + totalAquisicaoMaquinas;
        const totalDepreciacaoGeral = totalDepreciadoBenfeitorias + totalDepreciadoMaquinas;

        res.json({
            total_patrimonial_atual: Number(totalPatrimonialAtual.toFixed(2)),
            total_aquisicao: Number(totalAquisicaoGeral.toFixed(2)),
            total_depreciacao_acumulada: Number(totalDepreciacaoGeral.toFixed(2)),
            benfeitorias: {
                total_itens: benfeitorias.length,
                valor_aquisicao: Number(totalAquisicaoBenfeitorias.toFixed(2)),
                valor_atual: Number(totalAtualBenfeitorias.toFixed(2)),
                depreciacao_acumulada: Number(totalDepreciadoBenfeitorias.toFixed(2))
            },
            maquinas: {
                total_itens: maquinas.length,
                ativos: maquinas.filter(m => m.status === 'ativo').length,
                em_manutencao: maquinas.filter(m => m.status === 'em_manutencao').length,
                valor_aquisicao: Number(totalAquisicaoMaquinas.toFixed(2)),
                valor_atual: Number(totalAtualMaquinas.toFixed(2)),
                depreciacao_acumulada: Number(totalDepreciadoMaquinas.toFixed(2))
            },
            manutencoes: {
                total_gasto: totalManutencoes.total,
                total_registros: totalManutencoes.count
            }
        });
    } catch (error) {
        console.error('Erro ao calcular resumo do patrimônio:', error);
        res.status(500).json({ error: 'Erro ao calcular resumo do patrimônio' });
    }
});

// ==============================================================================
// 2. BENFEITORIAS
// ==============================================================================

// GET /api/patrimonio/benfeitorias - Lista benfeitorias com cálculo de depreciação
router.get('/benfeitorias', (req, res) => {
    try {
        const { tipo } = req.query;
        let query = 'SELECT * FROM benfeitorias WHERE 1=1';
        const params = [];

        if (tipo) {
            query += ' AND tipo = ?';
            params.push(tipo);
        }

        query += ' ORDER BY data_aquisicao DESC, created_at DESC';
        const rows = db.prepare(query).all(...params);

        const enriched = rows.map(b => ({
            ...b,
            ...calcularDepreciacao(b.valor_aquisicao, b.data_aquisicao, b.vida_util_anos)
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Erro ao listar benfeitorias:', error);
        res.status(500).json({ error: 'Erro ao listar benfeitorias' });
    }
});

// POST /api/patrimonio/benfeitorias - Cadastra benfeitoria
router.post('/benfeitorias', (req, res) => {
    try {
        const {
            fazenda_id = 1,
            tipo,
            descricao,
            valor_aquisicao,
            data_aquisicao,
            vida_util_anos,
            observacoes = ''
        } = req.body;

        const tiposValidos = ['casa_sede', 'casa_caseiro', 'curral', 'galpao', 'cerca', 'poco', 'outro'];
        if (!tipo || !tiposValidos.includes(tipo)) {
            return res.status(400).json({ error: `Tipo inválido. Escolha entre: ${tiposValidos.join(', ')}` });
        }
        if (!descricao || !descricao.trim()) {
            return res.status(400).json({ error: 'Descrição da benfeitoria é obrigatória' });
        }
        if (!valor_aquisicao || Number(valor_aquisicao) <= 0) {
            return res.status(400).json({ error: 'Valor de aquisição deve ser maior que zero' });
        }
        if (!data_aquisicao) {
            return res.status(400).json({ error: 'Data de aquisição é obrigatória' });
        }
        if (!vida_util_anos || Number(vida_util_anos) <= 0) {
            return res.status(400).json({ error: 'Vida útil em anos deve ser maior que zero' });
        }

        const insert = db.prepare(`
            INSERT INTO benfeitorias (
                fazenda_id, tipo, descricao, valor_aquisicao, data_aquisicao, vida_util_anos, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            fazenda_id,
            tipo,
            descricao.trim(),
            Number(valor_aquisicao),
            data_aquisicao,
            Number(vida_util_anos),
            observacoes ? observacoes.trim() : null
        );

        const newRow = db.prepare('SELECT * FROM benfeitorias WHERE id = ?').get(insert.lastInsertRowid);
        const enriched = {
            ...newRow,
            ...calcularDepreciacao(newRow.valor_aquisicao, newRow.data_aquisicao, newRow.vida_util_anos)
        };

        res.status(201).json(enriched);
    } catch (error) {
        console.error('Erro ao criar benfeitoria:', error);
        res.status(500).json({ error: 'Erro ao cadastrar benfeitoria' });
    }
});

// PUT /api/patrimonio/benfeitorias/:id - Atualiza benfeitoria
router.put('/benfeitorias/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { tipo, descricao, valor_aquisicao, data_aquisicao, vida_util_anos, observacoes } = req.body;

        const tiposValidos = ['casa_sede', 'casa_caseiro', 'curral', 'galpao', 'cerca', 'poco', 'outro'];
        if (!tipo || !tiposValidos.includes(tipo)) {
            return res.status(400).json({ error: `Tipo inválido. Escolha entre: ${tiposValidos.join(', ')}` });
        }
        if (!descricao || !descricao.trim()) {
            return res.status(400).json({ error: 'Descrição é obrigatória' });
        }
        if (!valor_aquisicao || Number(valor_aquisicao) <= 0) {
            return res.status(400).json({ error: 'Valor de aquisição deve ser maior que zero' });
        }
        if (!data_aquisicao) {
            return res.status(400).json({ error: 'Data de aquisição é obrigatória' });
        }
        if (!vida_util_anos || Number(vida_util_anos) <= 0) {
            return res.status(400).json({ error: 'Vida útil em anos deve ser maior que zero' });
        }

        db.prepare(`
            UPDATE benfeitorias
            SET tipo = ?, descricao = ?, valor_aquisicao = ?, data_aquisicao = ?, vida_util_anos = ?, observacoes = ?
            WHERE id = ?
        `).run(
            tipo,
            descricao.trim(),
            Number(valor_aquisicao),
            data_aquisicao,
            Number(vida_util_anos),
            observacoes ? observacoes.trim() : null,
            id
        );

        const updated = db.prepare('SELECT * FROM benfeitorias WHERE id = ?').get(id);
        if (!updated) {
            return res.status(404).json({ error: 'Benfeitoria não encontrada' });
        }

        res.json({
            ...updated,
            ...calcularDepreciacao(updated.valor_aquisicao, updated.data_aquisicao, updated.vida_util_anos)
        });
    } catch (error) {
        console.error('Erro ao atualizar benfeitoria:', error);
        res.status(500).json({ error: 'Erro ao atualizar benfeitoria' });
    }
});

// DELETE /api/patrimonio/benfeitorias/:id - Remove benfeitoria
router.delete('/benfeitorias/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM benfeitorias WHERE id = ?').run(id);
        res.json({ message: 'Benfeitoria excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir benfeitoria:', error);
        res.status(500).json({ error: 'Erro ao excluir benfeitoria' });
    }
});

// ==============================================================================
// 3. MÁQUINAS E EQUIPAMENTOS
// ==============================================================================

// GET /api/patrimonio/maquinas - Lista máquinas com depreciação e total de manutenções
router.get('/maquinas', (req, res) => {
    try {
        const { status, tipo } = req.query;
        let query = `
            SELECT 
                m.*,
                COALESCE((SELECT SUM(mt.valor) FROM manutencoes mt WHERE mt.maquina_id = m.id), 0) as total_gasto_manutencoes,
                (SELECT COUNT(*) FROM manutencoes mt WHERE mt.maquina_id = m.id) as total_manutencoes_count
            FROM maquinas_equipamentos m
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND m.status = ?';
            params.push(status);
        }

        if (tipo) {
            query += ' AND m.tipo = ?';
            params.push(tipo);
        }

        query += ' ORDER BY m.status ASC, m.data_aquisicao DESC';
        const rows = db.prepare(query).all(...params);

        const enriched = rows.map(m => ({
            ...m,
            ...calcularDepreciacao(m.valor_aquisicao, m.data_aquisicao, m.vida_util_anos)
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Erro ao listar máquinas:', error);
        res.status(500).json({ error: 'Erro ao listar máquinas' });
    }
});

// GET /api/patrimonio/maquinas/:id - Detalhes da máquina com histórico de manutenções
router.get('/maquinas/:id', (req, res) => {
    try {
        const { id } = req.params;
        const maquina = db.prepare('SELECT * FROM maquinas_equipamentos WHERE id = ?').get(id);

        if (!maquina) {
            return res.status(404).json({ error: 'Máquina/equipamento não encontrado' });
        }

        const manutencoes = db.prepare(`
            SELECT * FROM manutencoes
            WHERE maquina_id = ?
            ORDER BY data DESC, created_at DESC
        `).all(id);

        const totalManutencoes = manutencoes.reduce((acc, m) => acc + m.valor, 0);

        res.json({
            ...maquina,
            ...calcularDepreciacao(maquina.valor_aquisicao, maquina.data_aquisicao, maquina.vida_util_anos),
            total_gasto_manutencoes: totalManutencoes,
            manutencoes
        });
    } catch (error) {
        console.error('Erro ao buscar máquina:', error);
        res.status(500).json({ error: 'Erro ao buscar máquina' });
    }
});

// POST /api/patrimonio/maquinas - Cadastra máquina/equipamento
router.post('/maquinas', (req, res) => {
    try {
        const {
            fazenda_id = 1,
            nome,
            tipo,
            valor_aquisicao,
            data_aquisicao,
            vida_util_anos,
            status = 'ativo',
            observacoes = ''
        } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'Nome do equipamento/máquina é obrigatório' });
        }
        const tiposValidos = ['trator', 'implemento', 'veiculo', 'outro'];
        if (!tipo || !tiposValidos.includes(tipo)) {
            return res.status(400).json({ error: `Tipo inválido. Escolha entre: ${tiposValidos.join(', ')}` });
        }
        if (!valor_aquisicao || Number(valor_aquisicao) <= 0) {
            return res.status(400).json({ error: 'Valor de aquisição deve ser maior que zero' });
        }
        if (!data_aquisicao) {
            return res.status(400).json({ error: 'Data de aquisição é obrigatória' });
        }
        if (!vida_util_anos || Number(vida_util_anos) <= 0) {
            return res.status(400).json({ error: 'Vida útil em anos deve ser maior que zero' });
        }

        const insert = db.prepare(`
            INSERT INTO maquinas_equipamentos (
                fazenda_id, nome, tipo, valor_aquisicao, data_aquisicao, vida_util_anos, status, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            fazenda_id,
            nome.trim(),
            tipo,
            Number(valor_aquisicao),
            data_aquisicao,
            Number(vida_util_anos),
            status,
            observacoes ? observacoes.trim() : null
        );

        const newRow = db.prepare('SELECT * FROM maquinas_equipamentos WHERE id = ?').get(insert.lastInsertRowid);
        const enriched = {
            ...newRow,
            ...calcularDepreciacao(newRow.valor_aquisicao, newRow.data_aquisicao, newRow.vida_util_anos),
            total_gasto_manutencoes: 0,
            manutencoes: []
        };

        res.status(201).json(enriched);
    } catch (error) {
        console.error('Erro ao cadastrar máquina:', error);
        res.status(500).json({ error: 'Erro ao cadastrar máquina' });
    }
});

// PUT /api/patrimonio/maquinas/:id - Atualiza máquina/equipamento
router.put('/maquinas/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nome, tipo, valor_aquisicao, data_aquisicao, vida_util_anos, status, observacoes } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }
        const tiposValidos = ['trator', 'implemento', 'veiculo', 'outro'];
        if (!tipo || !tiposValidos.includes(tipo)) {
            return res.status(400).json({ error: `Tipo inválido. Escolha entre: ${tiposValidos.join(', ')}` });
        }
        if (!valor_aquisicao || Number(valor_aquisicao) <= 0) {
            return res.status(400).json({ error: 'Valor de aquisição deve ser maior que zero' });
        }
        if (!data_aquisicao) {
            return res.status(400).json({ error: 'Data de aquisição é obrigatória' });
        }
        if (!vida_util_anos || Number(vida_util_anos) <= 0) {
            return res.status(400).json({ error: 'Vida útil em anos deve ser maior que zero' });
        }

        db.prepare(`
            UPDATE maquinas_equipamentos
            SET nome = ?, tipo = ?, valor_aquisicao = ?, data_aquisicao = ?, vida_util_anos = ?, status = ?, observacoes = ?
            WHERE id = ?
        `).run(
            nome.trim(),
            tipo,
            Number(valor_aquisicao),
            data_aquisicao,
            Number(vida_util_anos),
            status || 'ativo',
            observacoes ? observacoes.trim() : null,
            id
        );

        const updated = db.prepare('SELECT * FROM maquinas_equipamentos WHERE id = ?').get(id);
        if (!updated) {
            return res.status(404).json({ error: 'Máquina não encontrada' });
        }

        res.json({
            ...updated,
            ...calcularDepreciacao(updated.valor_aquisicao, updated.data_aquisicao, updated.vida_util_anos)
        });
    } catch (error) {
        console.error('Erro ao atualizar máquina:', error);
        res.status(500).json({ error: 'Erro ao atualizar máquina' });
    }
});

// DELETE /api/patrimonio/maquinas/:id - Remove máquina
router.delete('/maquinas/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM maquinas_equipamentos WHERE id = ?').run(id);
        res.json({ message: 'Máquina excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir máquina:', error);
        res.status(500).json({ error: 'Erro ao excluir máquina' });
    }
});

// ==============================================================================
// 4. MANUTENÇÕES
// ==============================================================================

// GET /api/patrimonio/manutencoes - Lista histórico de manutenções
router.get('/manutencoes', (req, res) => {
    try {
        const { maquina_id } = req.query;
        let query = `
            SELECT 
                mt.*,
                m.nome as maquina_nome,
                m.tipo as maquina_tipo
            FROM manutencoes mt
            JOIN maquinas_equipamentos m ON mt.maquina_id = m.id
            WHERE 1=1
        `;
        const params = [];

        if (maquina_id) {
            query += ' AND mt.maquina_id = ?';
            params.push(Number(maquina_id));
        }

        query += ' ORDER BY mt.data DESC, mt.created_at DESC';
        const rows = db.prepare(query).all(...params);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar manutenções:', error);
        res.status(500).json({ error: 'Erro ao listar manutenções' });
    }
});

// POST /api/patrimonio/manutencoes - Registra manutenção e gera despesa no Financeiro automaticamente
router.post('/manutencoes', (req, res) => {
    try {
        const {
            maquina_id,
            data = new Date().toISOString().split('T')[0],
            descricao,
            valor,
            gerar_despesa_financeira = true
        } = req.body;

        if (!maquina_id) {
            return res.status(400).json({ error: 'Máquina é obrigatória' });
        }
        if (!descricao || !descricao.trim()) {
            return res.status(400).json({ error: 'Descrição do serviço de manutenção é obrigatória' });
        }
        if (!valor || Number(valor) <= 0) {
            return res.status(400).json({ error: 'Valor da manutenção deve ser maior que zero' });
        }
        if (!data) {
            return res.status(400).json({ error: 'Data da manutenção é obrigatória' });
        }

        const executeManutencao = db.transaction(() => {
            const maquina = db.prepare('SELECT * FROM maquinas_equipamentos WHERE id = ?').get(maquina_id);
            if (!maquina) {
                throw new Error('Máquina não encontrada');
            }

            // 1. Inserir registro de manutenção
            const insertMt = db.prepare(`
                INSERT INTO manutencoes (maquina_id, data, descricao, valor)
                VALUES (?, ?, ?, ?)
            `).run(
                Number(maquina_id),
                data,
                descricao.trim(),
                Number(valor)
            );

            // 2. Gerar despesa no Financeiro (categoria 'manutencao_maquina')
            let lancamentoFin = null;
            if (gerar_despesa_financeira) {
                const descFin = `Manutenção de ${maquina.tipo}: ${maquina.nome} - ${descricao.trim()}`;
                const insertFin = db.prepare(`
                    INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
                    VALUES (?, 'despesa', 'manutencao_maquina', ?, ?, ?)
                `).run(
                    maquina.fazenda_id,
                    Number(valor),
                    data,
                    descFin
                );
                lancamentoFin = db.prepare('SELECT * FROM financeiro WHERE id = ?').get(insertFin.lastInsertRowid);
            }

            const createdMt = db.prepare(`
                SELECT mt.*, m.nome as maquina_nome, m.tipo as maquina_tipo
                FROM manutencoes mt
                JOIN maquinas_equipamentos m ON mt.maquina_id = m.id
                WHERE mt.id = ?
            `).get(insertMt.lastInsertRowid);

            return {
                manutencao: createdMt,
                lancamento_financeiro: lancamentoFin
            };
        });

        const result = executeManutencao();
        res.status(201).json({
            message: 'Manutenção registrada e despesa lançada no Financeiro com sucesso!',
            ...result
        });
    } catch (error) {
        console.error('Erro ao registrar manutenção:', error);
        res.status(500).json({ error: error.message || 'Erro ao registrar manutenção' });
    }
});

// DELETE /api/patrimonio/manutencoes/:id - Remove registro de manutenção
router.delete('/manutencoes/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM manutencoes WHERE id = ?').run(id);
        res.json({ message: 'Registro de manutenção excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir manutenção:', error);
        res.status(500).json({ error: 'Erro ao excluir manutenção' });
    }
});

export default router;
