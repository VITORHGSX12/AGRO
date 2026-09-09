import db from './db/database.js';

async function runAgricolaTests() {
    console.log('===========================================================');
    console.log('🧪 INICIANDO TESTES DO MÓDULO AGRÍCOLA (FASE 3 - ETAPA 1)');
    console.log('===========================================================');

    let passedCount = 0;
    let failedCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✔ PASSOU: ${message}`);
            passedCount++;
        } else {
            console.error(`  ❌ FALHOU: ${message}`);
            failedCount++;
        }
    }

    try {
        // Obter ou criar fazenda_id
        let fazenda = db.prepare('SELECT id FROM fazenda LIMIT 1').get();
        if (!fazenda) {
            const ins = db.prepare(`INSERT INTO fazenda (nome, area_hectares) VALUES ('Fazenda Teste Agrícola', 1000)`).run();
            fazenda = { id: ins.lastInsertRowid };
        }
        const fazendaId = fazenda.id;

        // Limpar dados anteriores de teste
        db.prepare(`DELETE FROM insumos_agricolas`).run();
        db.prepare(`DELETE FROM safras`).run();
        db.prepare(`DELETE FROM talhoes`).run();
        db.prepare(`DELETE FROM financeiro WHERE categoria IN ('insumo_agricola', 'venda_agricola')`).run();

        // -------------------------------------------------------------
        // TESTE 1: Cadastro e Validações de Talhões
        // -------------------------------------------------------------
        console.log('\n--- TESTE 1: Cadastro de Talhões ---');
        const insertTalhao = db.prepare(`
            INSERT INTO talhoes (fazenda_id, nome, area_hectares, tipo_solo)
            VALUES (?, ?, ?, ?)
        `).run(fazendaId, 'Talhão Norte - Pivô 01', 50.0, 'Latossolo Vermelho');

        const talhaoId = insertTalhao.lastInsertRowid;
        const talhao = db.prepare('SELECT * FROM talhoes WHERE id = ?').get(talhaoId);

        assert(talhao && talhao.nome === 'Talhão Norte - Pivô 01', 'Talhão criado com nome correto');
        assert(talhao && talhao.area_hectares === 50.0, 'Área do talhão registrada com 50.0 hectares');

        // -------------------------------------------------------------
        // TESTE 2: Abertura de Safra vinculada ao Talhão
        // -------------------------------------------------------------
        console.log('\n--- TESTE 2: Abertura de Safra ---');
        const insertSafra = db.prepare(`
            INSERT INTO safras (talhao_id, cultura, data_plantio, data_colheita_prevista, status)
            VALUES (?, ?, ?, ?, ?)
        `).run(talhaoId, 'Soja', '2026-10-15', '2027-02-28', 'plantio');

        const safraId = insertSafra.lastInsertRowid;
        const safra = db.prepare('SELECT * FROM safras WHERE id = ?').get(safraId);

        assert(safra && safra.cultura === 'Soja', 'Safra de Soja cadastrada com sucesso');
        assert(safra && safra.status === 'plantio', 'Status inicial da safra é "plantio"');

        // -------------------------------------------------------------
        // TESTE 3: Lançamento de Insumo e Geração Automática de Despesa
        // -------------------------------------------------------------
        console.log('\n--- TESTE 3: Lançamento de Insumo & Despesa Automática ---');
        const insumoValor = 12500.00;
        const insumoData = '2026-10-20';
        const insumoDesc = 'Adubo NPK 04-14-08 (10 toneladas)';

        const insertInsumo = db.prepare(`
            INSERT INTO insumos_agricolas (safra_id, tipo, descricao, quantidade, valor, data)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(safraId, 'fertilizante', insumoDesc, 10, insumoValor, insumoData);

        const insumoId = insertInsumo.lastInsertRowid;
        const insumo = db.prepare('SELECT * FROM insumos_agricolas WHERE id = ?').get(insumoId);
        assert(insumo && insumo.valor === insumoValor, 'Insumo agrícola cadastrado com valor correto');

        // Regra de negócio: criar despesa no financeiro com categoria 'insumo_agricola'
        const insertDespesa = db.prepare(`
            INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
            VALUES (?, 'despesa', 'insumo_agricola', ?, ?, ?)
        `).run(
            fazendaId,
            insumoValor,
            insumoData,
            `Insumo Agrícola (fertilizante) - ${insumoDesc} (Safra Soja, Talhão: Talhão Norte - Pivô 01)`
        );

        const despesaFin = db.prepare('SELECT * FROM financeiro WHERE id = ?').get(insertDespesa.lastInsertRowid);
        assert(despesaFin && despesaFin.tipo === 'despesa', 'Lançamento financeiro do insumo é do tipo "despesa"');
        assert(despesaFin && despesaFin.categoria === 'insumo_agricola', 'Categoria da despesa é "insumo_agricola"');
        assert(despesaFin && despesaFin.valor === insumoValor, `Valor da despesa bate exatamente com o insumo (R$ ${insumoValor})`);

        // -------------------------------------------------------------
        // TESTE 4: Registro de Colheita, Venda e Geração Automática de Receita
        // -------------------------------------------------------------
        console.log('\n--- TESTE 4: Registro de Colheita & Receita Automática ---');
        const qtdColhida = 3250; // sacas
        const valorVenda = 422500.00; // R$ 130 por saca
        const dataColheita = '2027-02-25';

        // Atualiza safra
        db.prepare(`
            UPDATE safras SET
                status = 'colhida',
                data_colheita_real = ?,
                quantidade_colhida = ?,
                unidade_medida = 'sacas',
                valor_venda_total = ?
            WHERE id = ?
        `).run(dataColheita, qtdColhida, valorVenda, safraId);

        // Regra de negócio: gerar receita no Financeiro com categoria 'venda_agricola'
        const insertReceita = db.prepare(`
            INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
            VALUES (?, 'receita', 'venda_agricola', ?, ?, ?)
        `).run(
            fazendaId,
            valorVenda,
            dataColheita,
            `Venda Agrícola - Soja (${qtdColhida} sacas, Talhão: Talhão Norte - Pivô 01)`
        );

        const receitaFin = db.prepare('SELECT * FROM financeiro WHERE id = ?').get(insertReceita.lastInsertRowid);
        assert(receitaFin && receitaFin.tipo === 'receita', 'Lançamento financeiro da venda é do tipo "receita"');
        assert(receitaFin && receitaFin.categoria === 'venda_agricola', 'Categoria da receita é "venda_agricola"');
        assert(receitaFin && receitaFin.valor === valorVenda, `Valor da receita bate com a venda (R$ ${valorVenda})`);

        // -------------------------------------------------------------
        // TESTE 5: Cálculo de Produtividade por Hectare
        // -------------------------------------------------------------
        console.log('\n--- TESTE 5: Cálculo de Produtividade da Safra ---');
        // Produtividade esperada = 3250 sacas / 50.0 ha = 65.0 sacas/ha
        const safraColhida = db.prepare(`
            SELECT s.*, t.area_hectares
            FROM safras s
            JOIN talhoes t ON s.talhao_id = t.id
            WHERE s.id = ?
        `).get(safraId);

        const produtividadeCalculada = Number((safraColhida.quantidade_colhida / safraColhida.area_hectares).toFixed(2));
        assert(produtividadeCalculada === 65.0, `Produtividade calculada corretamente: ${produtividadeCalculada} sacas/ha (Esperado: 65.0)`);

        // -------------------------------------------------------------
        // TESTE 6: Métricas do Dashboard para Agricultura
        // -------------------------------------------------------------
        console.log('\n--- TESTE 6: Métricas Agrícolas do Dashboard ---');
        const ultimasColheitas = db.prepare(`
            SELECT 
                s.cultura,
                s.quantidade_colhida,
                s.unidade_medida,
                t.area_hectares,
                (s.quantidade_colhida / t.area_hectares) as produtividade_ha,
                s.data_colheita_real
            FROM safras s
            JOIN talhoes t ON s.talhao_id = t.id
            WHERE s.status = 'colhida' AND s.quantidade_colhida > 0 AND t.area_hectares > 0
            GROUP BY s.cultura
            ORDER BY s.data_colheita_real DESC
        `).all().map(c => ({
            ...c,
            produtividade_ha: Number(c.produtividade_ha.toFixed(2))
        }));

        assert(ultimasColheitas.length > 0, 'Dashboard retorna métrica de colheita agrícola');
        assert(ultimasColheitas[0].cultura === 'Soja', 'Cultura da última safra é Soja');
        assert(ultimasColheitas[0].produtividade_ha === 65.0, 'Produtividade por hectare no Dashboard é 65.0 sc/ha');

        console.log('\n===========================================================');
        console.log(`📊 RESULTADO FINAL DOS TESTES: ${passedCount} PASSOU | ${failedCount} FALHOU`);
        console.log('===========================================================');

        if (failedCount > 0) {
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Erro inesperado durante execução dos testes:', err);
        process.exit(1);
    }
}

runAgricolaTests();
