import db from './db/database.js';

console.log('================================================================');
console.log('🔍 AUDITORIA DO MOTOR DE CÁLCULO E FLUXO CRUZADO DO DASHBOARD');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✔ [PASSOU] ${message}`);
        passedTests++;
    } else {
        console.error(`  ❌ [FALHOU] ${message}`);
        failedTests++;
    }
}

function getDashboardData(mesAno) {
    const today = new Date();
    const currentYearMonth = mesAno || today.toISOString().slice(0, 7);
    const todayStr = today.toISOString().split('T')[0];

    const in7DaysDate = new Date(today);
    in7DaysDate.setDate(today.getDate() + 7);
    const in7DaysStr = in7DaysDate.toISOString().split('T')[0];

    // Rebanho
    const animaisStats = db.prepare(`
        SELECT 
            COUNT(CASE WHEN status = 'ativo' THEN 1 END) as total_ativos,
            COUNT(CASE WHEN status = 'vendido' THEN 1 END) as total_vendidos,
            COUNT(CASE WHEN status = 'morto' THEN 1 END) as total_mortos,
            COUNT(*) as total_geral,
            COALESCE(AVG(CASE WHEN status = 'ativo' AND peso_atual > 0 THEN peso_atual END), 0) as peso_medio_ativos
        FROM animais
    `).get();

    // Categorias
    const distribuicaoCategorias = db.prepare(`
        SELECT categoria, COUNT(*) as quantidade, COALESCE(AVG(CASE WHEN peso_atual > 0 THEN peso_atual END), 0) as peso_medio
        FROM animais WHERE status = 'ativo' GROUP BY categoria ORDER BY quantidade DESC
    `).all();

    // Financeiro
    const financeiroMes = db.prepare(`
        SELECT 
            COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as receitas,
            COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as despesas,
            COALESCE(SUM(CASE WHEN categoria = 'salario' THEN valor ELSE 0 END), 0) as gasto_folha
        FROM financeiro WHERE data LIKE ?
    `).get(`${currentYearMonth}%`);

    const receitas = Number(financeiroMes.receitas || 0);
    const despesas = Number(financeiroMes.despesas || 0);
    const saldo = Number((receitas - despesas).toFixed(2));
    const custoMedio = animaisStats.total_ativos > 0 ? Number((despesas / animaisStats.total_ativos).toFixed(2)) : 0;

    // Sanidade
    const sanidadeAlertas = db.prepare(`
        SELECT
            COUNT(CASE WHEN status != 'aplicada' AND data_proxima_dose < ? THEN 1 END) as atrasadas,
            COUNT(CASE WHEN status != 'aplicada' AND data_proxima_dose >= ? AND data_proxima_dose <= ? THEN 1 END) as vencendo_7dias,
            COUNT(CASE WHEN status != 'aplicada' THEN 1 END) as total_pendentes
        FROM sanidade
    `).get(todayStr, todayStr, in7DaysStr);

    // Ocupação Piquetes
    const ocupacaoPiquetes = db.prepare(`
        SELECT p.id, p.nome, p.capacidade_suporte, COUNT(CASE WHEN a.status = 'ativo' THEN 1 END) as total_animais
        FROM piquetes p LEFT JOIN animais a ON a.piquete_atual_id = p.id
        GROUP BY p.id
    `).all();

    // Agrícola
    const ultimasColheitas = db.prepare(`
        SELECT s.cultura, s.quantidade_colhida, t.area_hectares, (s.quantidade_colhida / t.area_hectares) as produtividade_ha
        FROM safras s JOIN talhoes t ON s.talhao_id = t.id
        WHERE s.status = 'colhida' AND s.quantidade_colhida > 0 AND t.area_hectares > 0
        ORDER BY s.data_colheita_real DESC
    `).all();

    return {
        rebanho: animaisStats,
        categorias: distribuicaoCategorias,
        financeiro: { receitas, despesas, saldo, custoMedio, gastoFolha: Number(financeiroMes.gasto_folha || 0) },
        sanidade: sanidadeAlertas,
        ocupacaoPiquetes,
        ultimasColheitas
    };
}

try {
    const currentMes = new Date().toISOString().slice(0, 7);
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. ESTADO BASE INICIAL
    console.log('📌 1. Verificando estado inicial do banco...');
    const base = getDashboardData(currentMes);
    console.log(`   Ativos: ${base.rebanho.total_ativos} | Saldo: R$ ${base.financeiro.saldo} | Pendências Sanitárias: ${base.sanidade.total_pendentes}`);
    assert(base.rebanho.total_geral >= 0, 'Consulta ao rebanho base executada com sucesso');

    // 2. TESTE: INSERÇÃO DE NOVO ANIMAL EM PIQUETE
    console.log('\n📌 2. Testando inserção de animal no Rebanho e reflexo no Dashboard...');
    const insertAnimal = db.prepare(`
        INSERT INTO animais (fazenda_id, identificacao, sexo, data_nascimento, raca, categoria, status, piquete_atual_id, peso_atual)
        VALUES (1, 'AUDIT-001', 'M', '2024-01-01', 'Nelore', 'boi_gordo', 'ativo', 3, 540)
    `);
    const animRes = insertAnimal.run();
    const animalId = animRes.lastInsertRowid;

    const afterAnimal = getDashboardData(currentMes);
    assert(afterAnimal.rebanho.total_ativos === base.rebanho.total_ativos + 1, `Total de ativos incrementado para ${afterAnimal.rebanho.total_ativos}`);
    const piq3 = afterAnimal.ocupacaoPiquetes.find(p => p.id === 3);
    const basePiq3 = base.ocupacaoPiquetes.find(p => p.id === 3);
    assert(piq3.total_animais === (basePiq3 ? basePiq3.total_animais + 1 : 1), `Pasto 03 incrementou lotação para ${piq3.total_animais} cabeças`);

    // 3. TESTE: TRANSFERÊNCIA DE PIQUETE
    console.log('\n📌 3. Testando transferência de piquete e atualização de lotação...');
    db.prepare(`UPDATE animais SET piquete_atual_id = 1 WHERE id = ?`).run(animalId);
    db.prepare(`
        INSERT INTO movimentacoes_animais (animal_id, tipo, data, valor, piquete_origem_id, piquete_destino_id)
        VALUES (?, 'transferencia', ?, 0, 3, 1)
    `).run(animalId, todayStr);

    const afterTransfer = getDashboardData(currentMes);
    const piq1 = afterTransfer.ocupacaoPiquetes.find(p => p.id === 1);
    const piq3After = afterTransfer.ocupacaoPiquetes.find(p => p.id === 3);
    assert(piq3After.total_animais === (basePiq3 ? basePiq3.total_animais : 0), 'Pasto 03 liberou a cabeça transferida');

    // 4. TESTE: VENDA DE ANIMAL E CRIAÇÃO DE RECEITA
    console.log('\n📌 4. Testando venda de animal (impacto em Rebanho, Pasto e Financeiro)...');
    const valorVenda = 7500.0;
    db.prepare(`UPDATE animais SET status = 'vendido', piquete_atual_id = NULL WHERE id = ?`).run(animalId);
    db.prepare(`
        INSERT INTO movimentacoes_animais (animal_id, tipo, data, valor, observacao)
        VALUES (?, 'venda', ?, ?, 'Venda de teste na auditoria')
    `).run(animalId, todayStr, valorVenda);
    db.prepare(`
        INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao, animal_id)
        VALUES (1, 'receita', 'venda_animal', ?, ?, 'Venda auditada', ?)
    `).run(valorVenda, todayStr, animalId);

    const afterVenda = getDashboardData(currentMes);
    assert(afterVenda.rebanho.total_ativos === base.rebanho.total_ativos, 'Total de ativos voltou ao número original após venda');
    assert(afterVenda.rebanho.total_vendidos === base.rebanho.total_vendidos + 1, 'Total de vendidos incrementado');
    assert(afterVenda.financeiro.receitas === base.financeiro.receitas + valorVenda, `Receita do mês aumentou em R$ ${valorVenda}`);
    assert(afterVenda.financeiro.saldo === base.financeiro.saldo + valorVenda, `Saldo do mês ajustado com precisão`);

    // 5. TESTE: REGISTRO DE DESPESA E CUSTO MÉDIO POR CABEÇA
    console.log('\n📌 5. Testando registro de despesa e recálculo do custo operacional médio...');
    const valorDespesa = 2400.0;
    const finDespesa = db.prepare(`
        INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
        VALUES (1, 'despesa', 'nutricao_racao', ?, ?, 'Compra emergencial de sal mineral')
    `).run(valorDespesa, todayStr);

    const afterDespesa = getDashboardData(currentMes);
    assert(afterDespesa.financeiro.despesas === base.financeiro.despesas + valorDespesa, `Despesas do mês somaram R$ ${valorDespesa}`);
    const expectedCustoMedio = Number((afterDespesa.financeiro.despesas / afterDespesa.rebanho.total_ativos).toFixed(2));
    assert(afterDespesa.financeiro.custoMedio === expectedCustoMedio, `Custo médio por animal recalculado perfeitamente para R$ ${afterDespesa.financeiro.custoMedio}`);

    // 6. TESTE: ALERTA SANITÁRIO TEMPORAL
    console.log('\n📌 6. Testando motor de sanidade e alertas de vacinação a vencer...');
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    const sanRes = db.prepare(`
        INSERT INTO sanidade (fazenda_id, animal_id, lote_ou_grupo, tipo, nome_produto, data_aplicacao, data_proxima_dose, status)
        VALUES (1, NULL, 'Lote Bezerros', 'vacina', 'Vacina Clostridiose Teste', ?, ?, 'pendente')
    `).run(todayStr, in3DaysStr);

    const afterSanidade = getDashboardData(currentMes);
    assert(afterSanidade.sanidade.vencendo_7dias === base.sanidade.vencendo_7dias + 1, 'Alerta de vacina vencendo em 7 dias disparado');
    assert(afterSanidade.sanidade.total_pendentes === base.sanidade.total_pendentes + 1, 'Contador de pendências sanitárias atualizado');

    // Concluir vacina
    db.prepare(`UPDATE sanidade SET status = 'aplicada' WHERE id = ?`).run(sanRes.lastInsertRowid);
    const afterConcluirSan = getDashboardData(currentMes);
    assert(afterConcluirSan.sanidade.vencendo_7dias === base.sanidade.vencendo_7dias, 'Alerta removido imediatamente após vacina ser aplicada');

    // 7. TESTE: PRODUTIVIDADE AGRÍCOLA
    console.log('\n📌 7. Testando cálculo de produtividade de colheita agrícola...');
    const talhao = db.prepare(`SELECT id, area_hectares FROM talhoes LIMIT 1`).get() || 
                  db.prepare(`INSERT INTO talhoes (fazenda_id, nome, area_hectares) VALUES (1, 'Talhão 01 - Audit', 50.0)`).run();
    const talhaoId = talhao.id || talhao.lastInsertRowid;
    const talhaoArea = talhao.area_hectares || 50.0;

    const safraRes = db.prepare(`
        INSERT INTO safras (talhao_id, cultura, data_plantio, data_colheita_real, quantidade_colhida, unidade_medida, status)
        VALUES (?, 'Milho Safrinha Audit', ?, ?, 3500.0, 'sacas', 'colhida')
    `).run(talhaoId, todayStr, todayStr);

    const afterSafra = getDashboardData(currentMes);
    const expectedProdutividade = Number((3500.0 / talhaoArea).toFixed(2));
    const milhoColheita = afterSafra.ultimasColheitas.find(c => c.cultura === 'Milho Safrinha Audit');
    assert(milhoColheita && Number(milhoColheita.produtividade_ha.toFixed(2)) === expectedProdutividade, `Produtividade calculada com precisão: ${expectedProdutividade} sc/ha`);

    // 8. LIMPEZA DOS REGISTROS DE TESTE
    console.log('\n🧹 Limpando dados temporários de teste da auditoria...');
    db.prepare(`DELETE FROM sanidade WHERE id = ?`).run(sanRes.lastInsertRowid);
    db.prepare(`DELETE FROM safras WHERE id = ?`).run(safraRes.lastInsertRowid);
    db.prepare(`DELETE FROM financeiro WHERE id = ?`).run(finDespesa.lastInsertRowid);
    db.prepare(`DELETE FROM financeiro WHERE animal_id = ?`).run(animalId);
    db.prepare(`DELETE FROM movimentacoes_animais WHERE animal_id = ?`).run(animalId);
    db.prepare(`DELETE FROM animais WHERE id = ?`).run(animalId);

    const finalState = getDashboardData(currentMes);
    assert(finalState.rebanho.total_ativos === base.rebanho.total_ativos, 'Banco de dados restaurado ao estado limpo original');

} catch (err) {
    console.error('Erro inesperado durante a auditoria:', err);
    failedTests++;
}

console.log('\n================================================================');
console.log(`📊 RESULTADO DA AUDITORIA: ${passedTests} PASSOU | ${failedTests} FALHOU`);
console.log('================================================================');

if (failedTests > 0) {
    process.exit(1);
}
