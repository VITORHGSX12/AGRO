import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/animais - Lista animais com filtros avançados
router.get('/', (req, res) => {
    try {
        const { status, categoria, piquete_id, busca, sexo } = req.query;

        let query = `
            SELECT 
                a.*,
                p.nome as piquete_nome,
                p.tamanho_hectares as piquete_tamanho,
                (
                    SELECT COUNT(*) 
                    FROM pesagens ps 
                    WHERE ps.animal_id = a.id
                ) as total_pesagens,
                (
                    SELECT ps.gmd_kg_dia 
                    FROM pesagens ps 
                    WHERE ps.animal_id = a.id 
                    ORDER BY ps.data_pesagem DESC, ps.id DESC 
                    LIMIT 1
                ) as ultimo_gmd
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

        if (sexo) {
            query += ` AND a.sexo = ?`;
            params.push(sexo);
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

// GET /api/animais/:id - Ficha completa do animal (cadastrais + pesagens + movimentações + sanidade)
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;

        const animal = db.prepare(`
            SELECT 
                a.*,
                p.nome as piquete_nome,
                p.tamanho_hectares as piquete_tamanho
            FROM animais a
            LEFT JOIN piquetes p ON a.piquete_atual_id = p.id
            WHERE a.id = ?
        `).get(id);

        if (!animal) {
            return res.status(404).json({ error: 'Animal não encontrado' });
        }

        // Histórico de Pesagens
        const pesagens = db.prepare(`
            SELECT * FROM pesagens
            WHERE animal_id = ?
            ORDER BY data_pesagem ASC, id ASC
        `).all(id);

        // Estatísticas de ganho de peso e GMD
        let pesoInicial = animal.peso_atual;
        let ganhoTotal = 0;
        let gmdMedio = 0;
        let diasTotais = 0;

        if (pesagens.length > 0) {
            pesoInicial = pesagens[0].peso;
            const ultimoPeso = pesagens[pesagens.length - 1].peso;
            ganhoTotal = Number((ultimoPeso - pesoInicial).toFixed(2));

            const d1 = new Date(pesagens[0].data_pesagem);
            const d2 = new Date(pesagens[pesagens.length - 1].data_pesagem);
            diasTotais = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));

            if (diasTotais > 0) {
                gmdMedio = Number((ganhoTotal / diasTotais).toFixed(3));
            }
        }

        // Histórico de Movimentações
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

        // Histórico Sanitário
        const sanidade = db.prepare(`
            SELECT * FROM sanidade
            WHERE animal_id = ?
            ORDER BY data_aplicacao DESC, created_at DESC
        `).all(id);

        res.json({
            ...animal,
            pesagens,
            estatisticas_peso: {
                peso_inicial: pesoInicial,
                peso_atual: animal.peso_atual,
                ganho_total_kg: ganhoTotal,
                dias_totais: diasTotais,
                gmd_medio_kg_dia: gmdMedio,
                total_pesagens: pesagens.length
            },
            movimentacoes,
            sanidade
        });
    } catch (error) {
        console.error('Erro ao buscar detalhes do animal:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes do animal' });
    }
});

// GET /api/animais/:id/pesagens - Lista histórico de pesagens
router.get('/:id/pesagens', (req, res) => {
    try {
        const { id } = req.params;
        const pesagens = db.prepare(`
            SELECT * FROM pesagens
            WHERE animal_id = ?
            ORDER BY data_pesagem ASC, id ASC
        `).all(id);
        res.json(pesagens);
    } catch (error) {
        console.error('Erro ao buscar pesagens do animal:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico de pesagens' });
    }
});

// POST /api/animais/:id/pesagens - Registra uma nova pesagem com cálculo automático de Ganho e GMD
router.post('/:id/pesagens', (req, res) => {
    try {
        const { id } = req.params;
        const { data_pesagem, peso, observacoes = '' } = req.body;

        const animal = db.prepare('SELECT * FROM animais WHERE id = ?').get(id);
        if (!animal) {
            return res.status(404).json({ error: 'Animal não encontrado' });
        }

        const pesoNum = Number(peso);
        if (!peso || isNaN(pesoNum) || pesoNum <= 0) {
            return res.status(400).json({ error: 'Peso deve ser um número positivo maior que zero' });
        }

        const dataStr = data_pesagem || new Date().toISOString().split('T')[0];

        // Busca a última pesagem anterior a esta data
        const ultimaPesagem = db.prepare(`
            SELECT * FROM pesagens
            WHERE animal_id = ? AND data_pesagem <= ?
            ORDER BY data_pesagem DESC, id DESC
            LIMIT 1
        `).get(id, dataStr);

        let ganhoPeso = 0;
        let gmd = 0;

        if (ultimaPesagem) {
            ganhoPeso = Number((pesoNum - ultimaPesagem.peso).toFixed(2));
            const d1 = new Date(ultimaPesagem.data_pesagem);
            const d2 = new Date(dataStr);
            const dias = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
            gmd = Number((ganhoPeso / dias).toFixed(3));
        }

        const insert = db.prepare(`
            INSERT INTO pesagens (animal_id, data_pesagem, peso, ganho_peso_kg, gmd_kg_dia, observacoes)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, dataStr, pesoNum, ganhoPeso, gmd, observacoes ? observacoes.trim() : null);

        // Atualiza o peso_atual na tabela principal de animais
        db.prepare('UPDATE animais SET peso_atual = ? WHERE id = ?').run(pesoNum, id);

        const novaPesagem = db.prepare('SELECT * FROM pesagens WHERE id = ?').get(insert.lastInsertRowid);
        res.status(201).json(novaPesagem);
    } catch (error) {
        console.error('Erro ao cadastrar pesagem:', error);
        res.status(500).json({ error: error.message || 'Erro ao registrar pesagem' });
    }
});

// DELETE /api/animais/:id/pesagens/:pesagemId - Remove uma pesagem
router.delete('/:id/pesagens/:pesagemId', (req, res) => {
    try {
        const { id, pesagemId } = req.params;
        db.prepare('DELETE FROM pesagens WHERE id = ? AND animal_id = ?').run(pesagemId, id);

        // Atualiza peso_atual para a última pesagem restante
        const ultima = db.prepare('SELECT peso FROM pesagens WHERE animal_id = ? ORDER BY data_pesagem DESC, id DESC LIMIT 1').get(id);
        if (ultima) {
            db.prepare('UPDATE animais SET peso_atual = ? WHERE id = ?').run(ultima.peso, id);
        }

        res.json({ message: 'Pesagem excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir pesagem:', error);
        res.status(500).json({ error: 'Erro ao excluir pesagem' });
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

        const idFormatada = identificacao.trim().toUpperCase();

        if (!['M', 'F'].includes(sexo)) {
            return res.status(400).json({ error: 'Sexo inválido. Escolha M ou F.' });
        }

        const validCategorias = ['bezerro', 'bezerra', 'novilha', 'novilho', 'vaca', 'touro', 'garrote', 'boi_gordo', 'outro'];
        if (!validCategorias.includes(categoria)) {
            return res.status(400).json({ error: `Categoria inválida. Opções: ${validCategorias.join(', ')}` });
        }

        // Verifica duplicidade de brinco dentro da mesma fazenda
        const existing = db.prepare('SELECT id FROM animais WHERE fazenda_id = ? AND UPPER(identificacao) = ?').get(fazenda_id, idFormatada);
        if (existing) {
            return res.status(400).json({ error: `Já existe um animal com o brinco "${idFormatada}" cadastrado nesta fazenda` });
        }

        const pesoNum = peso_atual ? Number(peso_atual) : null;
        const piqueteId = (status === 'ativo' && piquete_atual_id) ? Number(piquete_atual_id) : null;

        const insert = db.prepare(`
            INSERT INTO animais (
                fazenda_id, identificacao, sexo, data_nascimento, raca,
                categoria, status, piquete_atual_id, peso_atual, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            fazenda_id,
            idFormatada,
            sexo,
            data_nascimento || null,
            raca ? raca.trim() : null,
            categoria,
            status,
            piqueteId,
            pesoNum,
            observacoes ? observacoes.trim() : null
        );

        const newId = insert.lastInsertRowid;

        // Se informou peso inicial, cria automaticamente o primeiro registro na tabela de pesagens
        if (pesoNum && pesoNum > 0) {
            const dataInicial = data_nascimento || new Date().toISOString().split('T')[0];
            db.prepare(`
                INSERT INTO pesagens (animal_id, data_pesagem, peso, ganho_peso_kg, gmd_kg_dia, observacoes)
                VALUES (?, ?, ?, 0, 0, 'Pesagem inicial de cadastro')
            `).run(newId, dataInicial, pesoNum);
        }

        const newAnimal = db.prepare(`
            SELECT a.*, p.nome as piquete_nome
            FROM animais a
            LEFT JOIN piquetes p ON a.piquete_atual_id = p.id
            WHERE a.id = ?
        `).get(newId);

        res.status(201).json(newAnimal);
    } catch (error) {
        console.error('Erro ao cadastrar animal:', error);
        res.status(500).json({ error: error.message || 'Erro ao cadastrar animal' });
    }
});

// PUT /api/animais/:id - Atualiza dados do animal com regras estritas de status e pastagem
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

        if (identificacao && identificacao.trim().toUpperCase() !== animal.identificacao.toUpperCase()) {
            const existing = db.prepare('SELECT id FROM animais WHERE UPPER(identificacao) = ? AND id != ?').get(identificacao.trim().toUpperCase(), id);
            if (existing) {
                return res.status(400).json({ error: `Já existe outro animal com o brinco "${identificacao.trim().toUpperCase()}"` });
            }
        }

        const novoStatus = status || animal.status;
        let novoPiqueteId = piquete_atual_id !== undefined ? (piquete_atual_id ? Number(piquete_atual_id) : null) : animal.piquete_atual_id;

        // Regra de Integridade: se o animal for vendido ou morto, remove do piquete automaticamente
        if (novoStatus === 'vendido' || novoStatus === 'morto') {
            novoPiqueteId = null;
        }

        const novoPeso = peso_atual !== undefined ? (peso_atual ? Number(peso_atual) : null) : animal.peso_atual;

        db.prepare(`
            UPDATE animais SET
                identificacao = COALESCE(?, identificacao),
                sexo = COALESCE(?, sexo),
                data_nascimento = ?,
                raca = ?,
                categoria = COALESCE(?, categoria),
                status = ?,
                piquete_atual_id = ?,
                peso_atual = ?,
                observacoes = ?
            WHERE id = ?
        `).run(
            identificacao ? identificacao.trim().toUpperCase() : null,
            sexo || null,
            data_nascimento !== undefined ? data_nascimento : animal.data_nascimento,
            raca !== undefined ? (raca ? raca.trim() : null) : animal.raca,
            categoria || null,
            novoStatus,
            novoPiqueteId,
            novoPeso,
            observacoes !== undefined ? (observacoes ? observacoes.trim() : null) : animal.observacoes,
            id
        );

        // Se o peso foi alterado, registra automaticamente nova pesagem se não houver no mesmo dia
        if (novoPeso && novoPeso !== animal.peso_atual) {
            const todayStr = new Date().toISOString().split('T')[0];
            const pesagemHoje = db.prepare('SELECT id FROM pesagens WHERE animal_id = ? AND data_pesagem = ?').get(id, todayStr);
            if (!pesagemHoje) {
                const ultimaPesagem = db.prepare('SELECT * FROM pesagens WHERE animal_id = ? ORDER BY data_pesagem DESC LIMIT 1').get(id);
                let ganho = 0;
                let gmd = 0;
                if (ultimaPesagem) {
                    ganho = Number((novoPeso - ultimaPesagem.peso).toFixed(2));
                    const d1 = new Date(ultimaPesagem.data_pesagem);
                    const d2 = new Date(todayStr);
                    const dias = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
                    gmd = Number((ganho / dias).toFixed(3));
                }
                db.prepare(`
                    INSERT INTO pesagens (animal_id, data_pesagem, peso, ganho_peso_kg, gmd_kg_dia, observacoes)
                    VALUES (?, ?, ?, ?, ?, 'Atualização via edição cadastral')
                `).run(id, todayStr, novoPeso, ganho, gmd);
            }
        }

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

// DELETE /api/animais/:id - Remove animal e limpa vínculos em cascata
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM pesagens WHERE animal_id = ?').run(id);
        db.prepare('DELETE FROM animais WHERE id = ?').run(id);
        res.json({ message: 'Animal e histórico excluídos com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir animal:', error);
        res.status(500).json({ error: 'Erro ao excluir animal' });
    }
});

export default router;
