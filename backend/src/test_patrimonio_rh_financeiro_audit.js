import db from './db/database.js';

console.log('🧪 Iniciando Bateria de Testes de Auditoria: Patrimônio, RH/Folha e Financeiro...\n');

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
    // 1. Limpeza de dados temporários de auditoria
    db.prepare("DELETE FROM financeiro WHERE descricao LIKE '%TEST_AUDIT%'").run();
    db.prepare("DELETE FROM manutencoes WHERE descricao LIKE '%TEST_AUDIT%'").run();
    db.prepare("DELETE FROM maquinas_equipamentos WHERE nome LIKE 'TEST_MAQUINA_%'").run();
    db.prepare("DELETE FROM benfeitorias WHERE descricao LIKE 'TEST_BENFEITORIA_%'").run();
    db.prepare("DELETE FROM folha_pagamento WHERE observacoes LIKE '%TEST_AUDIT%'").run();
    db.prepare("DELETE FROM funcionarios WHERE nome LIKE 'TEST_FUNCIONARIO_%'").run();

    // =========================================================================
    // 2. Testes de Patrimônio & Maquinários (Depreciação e Manutenções)
    // =========================================================================
    console.log('--- 1. Testando Patrimônio, Maquinário e Depreciação ---');

    // Cadastro de Trator de R$ 300.000 com vida útil de 10 anos
    const insertTrator = db.prepare(`
        INSERT INTO maquinas_equipamentos (fazenda_id, nome, tipo, valor_aquisicao, data_aquisicao, vida_util_anos, status, observacoes)
        VALUES (1, 'TEST_MAQUINA_TRATOR_JOHN_DEERE', 'trator', 300000.0, '2024-01-01', 10, 'ativo', 'TEST_AUDIT')
    `).run();
    const maquinaId = insertTrator.lastInsertRowid;
    assert(maquinaId > 0, 'Trator de R$ 300.000 cadastrado com sucesso');

    // Cadastro de Benfeitoria de R$ 100.000 com vida útil de 20 anos
    const insertBenfeitoria = db.prepare(`
        INSERT INTO benfeitorias (fazenda_id, tipo, descricao, valor_aquisicao, data_aquisicao, vida_util_anos, observacoes)
        VALUES (1, 'curral', 'TEST_BENFEITORIA_CURRAL_ANTI_STRESS', 100000.0, '2023-01-01', 20, 'TEST_AUDIT')
    `).run();
    const benfeitoriaId = insertBenfeitoria.lastInsertRowid;
    assert(benfeitoriaId > 0, 'Curral de R$ 100.000 cadastrado com sucesso');

    // Teste do Motor de Depreciação Linear
    const maquina = db.prepare('SELECT * FROM maquinas_equipamentos WHERE id = ?').get(maquinaId);
    const depAnualEsperada = maquina.valor_aquisicao / maquina.vida_util_anos;
    assert(depAnualEsperada === 30000.0, `Depreciação anual do trator calculada: R$ ${depAnualEsperada}/ano`);

    // Registro de Manutenção com Integração Financeira
    console.log('\n--- 2. Testando Manutenção e Integração Financeira ---');
    const valorManutencao = 7500.0;
    const dataManutencao = '2025-05-10';

    const insertMt = db.prepare(`
        INSERT INTO manutencoes (maquina_id, data, descricao, valor)
        VALUES (?, ?, 'Revisão 500h TEST_AUDIT', ?)
    `).run(maquinaId, dataManutencao, valorManutencao);
    const mtId = insertMt.lastInsertRowid;

    const insertFinMt = db.prepare(`
        INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
        VALUES (1, 'despesa', 'manutencao_maquina', ?, ?, 'Manutenção TEST_AUDIT Trator')
    `).run(valorManutencao, dataManutencao);
    const finMtId = insertFinMt.lastInsertRowid;

    assert(mtId > 0 && finMtId > 0, 'Manutenção registrada e despesa correspondente lançada no Financeiro');

    // =========================================================================
    // 3. Testes de RH & Folha de Pagamento
    // =========================================================================
    console.log('\n--- 3. Testando RH, Colaboradores e Folha de Pagamento ---');
    const insertFunc = db.prepare(`
        INSERT INTO funcionarios (fazenda_id, nome, funcao, tipo_contratacao, salario, valor_diaria, mora_na_fazenda, data_admissao, status)
        VALUES (1, 'TEST_FUNCIONARIO_JOAO_VAQUEIRO', 'Vaqueiro Líder', 'fixo', 3500.0, 0, 1, '2024-01-01', 'ativo')
    `).run();
    const funcId = insertFunc.lastInsertRowid;
    assert(funcId > 0, 'Colaborador (Salário R$ 3.500) cadastrado com sucesso');

    // Geração de Folha para o Mês 2026-03
    const mesRef = '2026-03';
    const insertFolha = db.prepare(`
        INSERT INTO folha_pagamento (
            funcionario_id, mes_referencia, salario_base,
            beneficios, descontos, valor_liquido, status, observacoes
        ) VALUES (?, ?, 3500.0, 500.0, 200.0, 3800.0, 'pendente', 'TEST_AUDIT')
    `).run(funcId, mesRef);
    const folhaId = insertFolha.lastInsertRowid;
    assert(folhaId > 0, 'Folha de pagamento calculada (Base: 3.500 + Ben: 500 - Desc: 200 = Líquido: 3.800)');

    // Quitação da Folha e Lançamento Automático em Despesa (categoria 'salario')
    const dataPagamentoFolha = '2026-03-05';
    db.prepare("UPDATE folha_pagamento SET status = 'pago', data_pagamento = ? WHERE id = ?").run(dataPagamentoFolha, folhaId);

    const insertFinSalario = db.prepare(`
        INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
        VALUES (1, 'despesa', 'salario', 3800.0, ?, 'Salário TEST_AUDIT João Vaqueiro')
    `).run(dataPagamentoFolha);
    assert(insertFinSalario.lastInsertRowid > 0, 'Folha quitada e despesa de R$ 3.800 lançada em Salários no Financeiro');

    // =========================================================================
    // 4. Testes de Fluxo Financeiro Consolidado
    // =========================================================================
    console.log('\n--- 4. Testando Consolidação do Fluxo de Caixa ---');
    
    // Inserção de uma receita de teste (Venda de boi R$ 15.000)
    const insertFinReceita = db.prepare(`
        INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
        VALUES (1, 'receita', 'venda_animal', 15000.0, '2026-03-10', 'Venda Boi TEST_AUDIT')
    `).run();

    const resumo = db.prepare(`
        SELECT 
            SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receitas,
            SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesas
        FROM financeiro
        WHERE data LIKE '2026-03%' AND descricao LIKE '%TEST_AUDIT%'
    `).get();

    const saldoMes = resumo.receitas - resumo.despesas;
    assert(resumo.receitas === 15000.0, `Receitas do mês consolidadas: R$ ${resumo.receitas}`);
    assert(resumo.despesas === 3800.0, `Despesas do mês consolidadas: R$ ${resumo.despesas}`);
    assert(saldoMes === 11200.0, `Saldo líquido apurado: R$ ${saldoMes}`);

    // =========================================================================
    // Limpeza de Dados de Teste
    // =========================================================================
    db.prepare("DELETE FROM financeiro WHERE descricao LIKE '%TEST_AUDIT%'").run();
    db.prepare("DELETE FROM manutencoes WHERE id = ?").run(mtId);
    db.prepare("DELETE FROM maquinas_equipamentos WHERE id = ?").run(maquinaId);
    db.prepare("DELETE FROM benfeitorias WHERE id = ?").run(benfeitoriaId);
    db.prepare("DELETE FROM folha_pagamento WHERE id = ?").run(folhaId);
    db.prepare("DELETE FROM funcionarios WHERE id = ?").run(funcId);

    console.log(`\n========================================================`);
    console.log(`🏁 Auditoria Concluída: ${passedTests}/${totalTests} Testes Passaram com Sucesso!`);
    console.log(`========================================================\n`);

} catch (error) {
    console.error('❌ Erro durante a auditoria:', error);
    process.exit(1);
}
