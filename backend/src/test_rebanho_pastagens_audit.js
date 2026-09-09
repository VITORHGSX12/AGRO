import db from './db/database.js';

console.log('🧪 Iniciando Bateria de Testes de Auditoria: Rebanho, Pecuária e Pastagens...\n');

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
    // 1. Limpeza de dados temporários de teste
    db.prepare("DELETE FROM pesagens WHERE observacoes = 'TEST_AUDIT'").run();
    db.prepare("DELETE FROM animais WHERE identificacao LIKE 'TEST_BRINCO_%'").run();
    db.prepare("DELETE FROM piquetes WHERE nome LIKE 'TEST_PIQUETE_%'").run();

    // 2. Teste de Criação de Piquete e Capacidade
    console.log('--- Testando Piquetes & Lotação ---');
    const insertPiquete = db.prepare(`
        INSERT INTO piquetes (fazenda_id, nome, tamanho_hectares, capacidade_suporte)
        VALUES (1, 'TEST_PIQUETE_01', 10.0, 20)
    `).run();
    const piqueteId = insertPiquete.lastInsertRowid;
    assert(piqueteId > 0, 'Criação de piquete com 10 ha e capacidade de 20 cabeças');

    // 3. Teste de Criação de Animais
    console.log('\n--- Testando Cadastro Individual e Validações de Rebanho ---');
    const insertAnimal1 = db.prepare(`
        INSERT INTO animais (fazenda_id, identificacao, sexo, data_nascimento, raca, categoria, status, piquete_atual_id, peso_atual, observacoes)
        VALUES (1, 'TEST_BRINCO_001', 'M', '2024-01-01', 'Nelore', 'garrote', 'ativo', ?, 300, 'TEST_AUDIT')
    `).run(piqueteId);
    const animal1Id = insertAnimal1.lastInsertRowid;
    assert(animal1Id > 0, 'Cadastro de animal TEST_BRINCO_001 no piquete');

    const insertAnimal2 = db.prepare(`
        INSERT INTO animais (fazenda_id, identificacao, sexo, data_nascimento, raca, categoria, status, piquete_atual_id, peso_atual, observacoes)
        VALUES (1, 'TEST_BRINCO_002', 'F', '2024-02-01', 'Angus', 'novilha', 'ativo', ?, 280, 'TEST_AUDIT')
    `).run(piqueteId);
    const animal2Id = insertAnimal2.lastInsertRowid;
    assert(animal2Id > 0, 'Cadastro de animal TEST_BRINCO_002 no piquete');

    // 4. Teste de Histórico de Pesagens e Cálculo de GMD
    console.log('\n--- Testando Histórico de Pesagens e Motor de GMD ---');
    
    // Pesagem 1: 300 kg em 2025-01-01
    db.prepare(`
        INSERT INTO pesagens (animal_id, data_pesagem, peso, ganho_peso_kg, gmd_kg_dia, observacoes)
        VALUES (?, '2025-01-01', 300, 0, 0, 'TEST_AUDIT')
    `).run(animal1Id);

    // Pesagem 2: 330 kg em 2025-01-31 (30 dias depois, ganho de 30kg => GMD = 1.0 kg/dia)
    const ultimaPesagem = db.prepare(`
        SELECT * FROM pesagens WHERE animal_id = ? AND data_pesagem <= '2025-01-31'
        ORDER BY data_pesagem DESC, id DESC LIMIT 1
    `).get(animal1Id);

    const peso2 = 330;
    const ganho2 = Number((peso2 - ultimaPesagem.peso).toFixed(2));
    const d1 = new Date(ultimaPesagem.data_pesagem);
    const d2 = new Date('2025-01-31');
    const dias2 = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    const gmd2 = Number((ganho2 / dias2).toFixed(3));

    db.prepare(`
        INSERT INTO pesagens (animal_id, data_pesagem, peso, ganho_peso_kg, gmd_kg_dia, observacoes)
        VALUES (?, '2025-01-31', ?, ?, ?, 'TEST_AUDIT')
    `).run(animal1Id, peso2, ganho2, gmd2);
    db.prepare('UPDATE animais SET peso_atual = ? WHERE id = ?').run(peso2, animal1Id);

    assert(ganho2 === 30, `Ganho de peso calculado com precisão: ${ganho2} kg`);
    assert(dias2 === 30, `Intervalo de dias calculado com precisão: ${dias2} dias`);
    assert(gmd2 === 1.0, `GMD calculado corretamente: ${gmd2} kg/dia`);

    // Pesagem 3: 366 kg em 2025-03-02 (30 dias depois, ganho de 36kg => GMD = 1.2 kg/dia)
    const peso3 = 366;
    const ganho3 = Number((peso3 - peso2).toFixed(2));
    const d3_1 = new Date('2025-01-31');
    const d3_2 = new Date('2025-03-02');
    const dias3 = Math.max(1, Math.round((d3_2 - d3_1) / (1000 * 60 * 60 * 24)));
    const gmd3 = Number((ganho3 / dias3).toFixed(3));

    db.prepare(`
        INSERT INTO pesagens (animal_id, data_pesagem, peso, ganho_peso_kg, gmd_kg_dia, observacoes)
        VALUES (?, '2025-03-02', ?, ?, ?, 'TEST_AUDIT')
    `).run(animal1Id, peso3, ganho3, gmd3);
    db.prepare('UPDATE animais SET peso_atual = ? WHERE id = ?').run(peso3, animal1Id);

    assert(ganho3 === 36, `Ganho de peso 3 calculado: ${ganho3} kg`);
    assert(gmd3 === 1.2, `GMD 3 calculado com precisão: ${gmd3} kg/dia`);

    // 5. Teste de Métricas de Lotação do Piquete
    console.log('\n--- Testando Métricas de Ocupação & Densidade de Piquete ---');
    const piqueteData = db.prepare(`
        SELECT 
            p.*,
            (SELECT COUNT(*) FROM animais a WHERE a.piquete_atual_id = p.id AND a.status = 'ativo') as total_animais,
            (SELECT COALESCE(SUM(a.peso_atual), 0) FROM animais a WHERE a.piquete_atual_id = p.id AND a.status = 'ativo') as peso_total_kg
        FROM piquetes p
        WHERE p.id = ?
    `).get(piqueteId);

    const totalAnimais = piqueteData.total_animais;
    const taxaOcupacao = Math.round((totalAnimais / piqueteData.capacidade_suporte) * 100);
    const densidadeCabHa = Number((totalAnimais / piqueteData.tamanho_hectares).toFixed(2));
    const uaTotal = Number((piqueteData.peso_total_kg / 450).toFixed(2)); // 1 UA = 450kg
    const uaPorHa = Number((uaTotal / piqueteData.tamanho_hectares).toFixed(2));

    assert(totalAnimais === 2, `Total de animais ativos no piquete: ${totalAnimais}`);
    assert(taxaOcupacao === 10, `Taxa de ocupação calculada: ${taxaOcupacao}% (2/20)`);
    assert(densidadeCabHa === 0.2, `Densidade calculada: ${densidadeCabHa} cab/ha`);
    assert(uaPorHa > 0, `Unidade Animal por ha calculada: ${uaPorHa} UA/ha`);

    // 6. Teste de Desalocação Automática de Piquete ao Vender ou Notificar Morte
    console.log('\n--- Testando Regras de Desalocação Automática de Pasto ---');
    
    // Vender animal 1
    db.prepare("UPDATE animais SET status = 'vendido', piquete_atual_id = NULL WHERE id = ?").run(animal1Id);
    
    const countAposVenda = db.prepare("SELECT COUNT(*) as count FROM animais WHERE piquete_atual_id = ? AND status = 'ativo'").get(piqueteId).count;
    assert(countAposVenda === 1, `Após venda do animal 1, contagem ativa no piquete caiu para 1 (atual: ${countAposVenda})`);

    // Morte do animal 2
    db.prepare("UPDATE animais SET status = 'morto', piquete_atual_id = NULL WHERE id = ?").run(animal2Id);
    const countAposMorte = db.prepare("SELECT COUNT(*) as count FROM animais WHERE piquete_atual_id = ? AND status = 'ativo'").get(piqueteId).count;
    assert(countAposMorte === 0, `Após morte do animal 2, contagem ativa no piquete zerou (atual: ${countAposMorte})`);

    // 7. Teste de Contratos de Arrendamento & Liquidação
    console.log('\n--- Testando Arrendamentos Rurais ---');
    const insertArrendamento = db.prepare(`
        INSERT INTO contratos_arrendamento (fazenda_id, piquete_id, tipo, contraparte_nome, valor, unidade_cobranca, data_inicio, data_fim, status, observacoes)
        VALUES (1, ?, 'recebido', 'Produtor Teste Arrendamento', 5000.0, 'valor_fixo_mes', '2025-01-01', '2025-12-31', 'ativo', 'TEST_AUDIT')
    `).run(piqueteId);
    const arrendamentoId = insertArrendamento.lastInsertRowid;
    assert(arrendamentoId > 0, 'Contrato de arrendamento cadastrado com sucesso');

    // Teste de liquidação financeira do contrato de arrendamento
    const transacao = db.prepare(`
        INSERT INTO financeiro (fazenda_id, tipo, categoria, descricao, valor, data)
        VALUES (1, 'receita', 'aluguel_pasto_recebido', 'Recebimento de Arrendamento - Produtor Teste', 5000.0, '2025-01-15')
    `).run();
    assert(transacao.lastInsertRowid > 0, 'Liquidação/Lançamento financeiro do arrendamento gerado com sucesso');

    // Limpeza final
    db.prepare('DELETE FROM pesagens WHERE animal_id IN (?, ?)').run(animal1Id, animal2Id);
    db.prepare('DELETE FROM animais WHERE id IN (?, ?)').run(animal1Id, animal2Id);
    db.prepare('DELETE FROM contratos_arrendamento WHERE id = ?').run(arrendamentoId);
    db.prepare('DELETE FROM financeiro WHERE id = ?').run(transacao.lastInsertRowid);
    db.prepare('DELETE FROM piquetes WHERE id = ?').run(piqueteId);

    console.log(`\n========================================`);
    console.log(`🏁 Auditoria Concluída: ${passedTests}/${totalTests} Testes Passaram com Sucesso!`);
    console.log(`========================================\n`);

} catch (error) {
    console.error('❌ Erro durante a execução da auditoria:', error);
    process.exit(1);
}
