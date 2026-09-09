import db from './db/database.js';

console.log('🧪 Iniciando Bateria de Testes de Auditoria: Agrícola (Lavouras & Safras) e Sanidade Animal...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
    totalTests++;
    if (condition) {
        console.log(`  ✅ [PASS] ${testName}`);
        passedTests++;
    } else {
        console.error(`  ❌ [FAIL] ${testName}`);
    }
}

try {
    // 1. Limpeza de dados de teste anteriores
    db.prepare("DELETE FROM financeiro WHERE descricao LIKE '%TEST_AUDIT%'").run();
    db.prepare("DELETE FROM insumos_agricolas WHERE descricao LIKE '%TEST_AUDIT%'").run();
    db.prepare("DELETE FROM safras WHERE observacoes LIKE '%TEST_AUDIT%'").run();
    db.prepare("DELETE FROM talhoes WHERE nome LIKE 'TEST_TALHAO_%'").run();
    db.prepare("DELETE FROM sanidade WHERE observacoes LIKE '%TEST_AUDIT%'").run();

    // =========================================================================
    // 2. Testes do Módulo Agrícola (Talhões, Safras, Insumos e Colheita)
    // =========================================================================
    console.log('--- 1. Testando Cadastro de Talhão & Lavouras ---');
    const insertTalhao = db.prepare(`
        INSERT INTO talhoes (fazenda_id, nome, area_hectares, tipo_solo)
        VALUES (1, 'TEST_TALHAO_50HA', 50.0, 'Argiloso Vermelho')
    `).run();
    const talhaoId = insertTalhao.lastInsertRowid;
    assert(talhaoId > 0, 'Talhão de 50 hectares cadastrado com sucesso');

    console.log('\n--- 2. Testando Ciclo de Safra e Lançamento de Insumos ---');
    const insertSafra = db.prepare(`
        INSERT INTO safras (talhao_id, cultura, data_plantio, data_colheita_prevista, status, observacoes)
        VALUES (?, 'Soja Transgênica', '2025-10-15', '2026-02-28', 'plantio', 'TEST_AUDIT')
    `).run(talhaoId);
    const safraId = insertSafra.lastInsertRowid;
    assert(safraId > 0, 'Safra de Soja iniciada no Talhão');

    // Lançamento de Insumo 1: Sementes (R$ 20.000)
    const insumo1 = db.prepare(`
        INSERT INTO insumos_agricolas (safra_id, tipo, descricao, quantidade, valor, data)
        VALUES (?, 'semente', 'Semente Soja Certificada TEST_AUDIT', 50, 20000.0, '2025-10-15')
    `).run(safraId);
    const fin1 = db.prepare(`
        INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
        VALUES (1, 'despesa', 'insumo_agricola', 20000.0, '2025-10-15', 'Insumo TEST_AUDIT Semente')
    `).run();
    assert(insumo1.lastInsertRowid > 0 && fin1.lastInsertRowid > 0, 'Insumo 1 (Sementes R$ 20.000) e despesa financeira integrados');

    // Lançamento de Insumo 2: Fertilizante (R$ 30.000)
    const insumo2 = db.prepare(`
        INSERT INTO insumos_agricolas (safra_id, tipo, descricao, quantidade, valor, data)
        VALUES (?, 'fertilizante', 'NPK 04-14-08 TEST_AUDIT', 20, 30000.0, '2025-10-20')
    `).run(safraId);
    const fin2 = db.prepare(`
        INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
        VALUES (1, 'despesa', 'insumo_agricola', 30000.0, '2025-10-20', 'Insumo TEST_AUDIT Fertilizante')
    `).run();
    assert(insumo2.lastInsertRowid > 0 && fin2.lastInsertRowid > 0, 'Insumo 2 (Fertilizante R$ 30.000) e despesa financeira integrados');

    // Verificação de Custo Total e Custo por Hectare
    const totalInsumos = db.prepare('SELECT SUM(valor) as total FROM insumos_agricolas WHERE safra_id = ?').get(safraId).total;
    const custoPorHa = totalInsumos / 50.0;
    assert(totalInsumos === 50000.0, `Custo total de insumos consolidado: R$ ${totalInsumos}`);
    assert(custoPorHa === 1000.0, `Custo por hectare calculado com precisão: R$ ${custoPorHa}/ha`);

    // Atualização de estágio da safra para 'em_desenvolvimento'
    db.prepare("UPDATE safras SET status = 'em_desenvolvimento' WHERE id = ?").run(safraId);
    const safraDesenv = db.prepare('SELECT status FROM safras WHERE id = ?').get(safraId);
    assert(safraDesenv.status === 'em_desenvolvimento', 'Transição de estágio da safra para "em_desenvolvimento"');

    // Fechamento da Colheita (3.500 sacas colhidas, Venda de R$ 420.000)
    console.log('\n--- 3. Testando Fechamento de Colheita e Produtividade ---');
    const qtdColhida = 3500;
    const valorVenda = 420000.0;
    const dataColheita = '2026-03-01';

    db.prepare(`
        UPDATE safras SET
            status = 'colhida',
            data_colheita_real = ?,
            quantidade_colhida = ?,
            unidade_medida = 'sacas',
            valor_venda_total = ?
        WHERE id = ?
    `).run(dataColheita, qtdColhida, valorVenda, safraId);

    const finReceita = db.prepare(`
        INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
        VALUES (1, 'receita', 'venda_agricola', ?, ?, 'Venda Agrícola TEST_AUDIT Soja')
    `).run(valorVenda, dataColheita);
    assert(finReceita.lastInsertRowid > 0, 'Receita de venda agrícola (R$ 420.000) gerada no Financeiro');

    const safraColhida = db.prepare(`
        SELECT s.*, t.area_hectares
        FROM safras s
        JOIN talhoes t ON s.talhao_id = t.id
        WHERE s.id = ?
    `).get(safraId);

    const produtividadeCalculada = safraColhida.quantidade_colhida / safraColhida.area_hectares;
    const lucroLiquido = safraColhida.valor_venda_total - totalInsumos;
    const lucroPorHa = lucroLiquido / safraColhida.area_hectares;

    assert(produtividadeCalculada === 70.0, `Produtividade calculada com precisão: ${produtividadeCalculada} sc/ha`);
    assert(lucroLiquido === 370000.0, `Lucro líquido da safra: R$ ${lucroLiquido}`);
    assert(lucroPorHa === 7400.0, `Margem líquida por hectare: R$ ${lucroPorHa}/ha`);

    // =========================================================================
    // 3. Testes do Módulo de Sanidade Animal & Período de Carência
    // =========================================================================
    console.log('\n--- 4. Testando Protocolos Sanitários, Vacinas e Carência ---');

    // Cadastro de Aplicação com Carência de 28 dias
    const today = new Date().toISOString().split('T')[0];
    const dCarencia = new Date();
    dCarencia.setDate(dCarencia.getDate() + 28);
    const dataFimCarenciaEsperada = dCarencia.toISOString().split('T')[0];

    const insertSanidade = db.prepare(`
        INSERT INTO sanidade (
            fazenda_id, lote_ou_grupo, tipo, nome_produto,
            data_aplicacao, data_proxima_dose, dias_carencia,
            data_fim_carencia, status, observacoes
        ) VALUES (1, 'Lote Confinamento TEST_AUDIT', 'vacina', 'Vacina Clostridiose TEST_AUDIT', ?, NULL, 28, ?, 'aplicada', 'TEST_AUDIT')
    `).run(today, dataFimCarenciaEsperada);
    const sanidadeId = insertSanidade.lastInsertRowid;
    assert(sanidadeId > 0, 'Aplicação sanitária coletiva registrada com sucesso');

    const sanidadeSalva = db.prepare('SELECT * FROM sanidade WHERE id = ?').get(sanidadeId);
    assert(sanidadeSalva.dias_carencia === 28, 'Dias de carência configurados: 28 dias');
    assert(sanidadeSalva.data_fim_carencia === dataFimCarenciaEsperada, `Data de fim de carência calculada: ${sanidadeSalva.data_fim_carencia}`);

    // Teste de cálculo de animal sob carência ativa
    const sobCarencia = sanidadeSalva.data_fim_carencia >= today;
    assert(sobCarencia === true, 'Animal/Lote sob bloqueio de abate sanitário ativo (sob_carencia = true)');

    // Teste de dose pendente e alerta de vencimento
    const dVencendo = new Date();
    dVencendo.setDate(dVencendo.getDate() + 3); // vence em 3 dias
    const dataProximaDose = dVencendo.toISOString().split('T')[0];

    const insertPendente = db.prepare(`
        INSERT INTO sanidade (
            fazenda_id, lote_ou_grupo, tipo, nome_produto,
            data_aplicacao, data_proxima_dose, dias_carencia, status, observacoes
        ) VALUES (1, 'Bezerros Lote 01 TEST_AUDIT', 'vermifugo', 'Vermífugo Injetável TEST_AUDIT', ?, ?, 0, 'pendente', 'TEST_AUDIT')
    `).run(today, dataProximaDose);
    const pendenteId = insertPendente.lastInsertRowid;
    assert(pendenteId > 0, 'Agendamento sanitário pendente cadastrado');

    // Conclusão da dose pendente
    db.prepare(`
        UPDATE sanidade SET status = 'aplicada', data_aplicacao = ? WHERE id = ?
    `).run(today, pendenteId);
    const pendenteConcluido = db.prepare('SELECT status FROM sanidade WHERE id = ?').get(pendenteId);
    assert(pendenteConcluido.status === 'aplicada', 'Conclusão e baixa da dose agendada');

    // =========================================================================
    // Limpeza de Dados de Teste
    // =========================================================================
    db.prepare("DELETE FROM financeiro WHERE descricao LIKE '%TEST_AUDIT%'").run();
    db.prepare("DELETE FROM insumos_agricolas WHERE descricao LIKE '%TEST_AUDIT%'").run();
    db.prepare("DELETE FROM safras WHERE id = ?").run(safraId);
    db.prepare("DELETE FROM talhoes WHERE id = ?").run(talhaoId);
    db.prepare("DELETE FROM sanidade WHERE id IN (?, ?)").run(sanidadeId, pendenteId);

    console.log(`\n========================================================`);
    console.log(`🏁 Auditoria Concluída: ${passedTests}/${totalTests} Testes Passaram com Sucesso!`);
    console.log(`========================================================\n`);

} catch (error) {
    console.error('❌ Erro na execução da auditoria:', error);
    process.exit(1);
}
