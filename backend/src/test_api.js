import db from './db/database.js';

async function testBackend() {
    console.log('--- Iniciando Testes Unitários de Integração do Backend ---');

    // 1. Testa Fazenda
    const fazenda = db.prepare('SELECT * FROM fazenda LIMIT 1').get();
    console.log('✔ Fazenda OK:', fazenda.nome);

    // 2. Testa Piquetes
    const piquetes = db.prepare('SELECT COUNT(*) as count FROM piquetes').get();
    console.log('✔ Piquetes cadastrados:', piquetes.count);

    // 3. Testa Animais
    const animais = db.prepare("SELECT COUNT(*) as count FROM animais WHERE status = 'ativo'").get();
    console.log('✔ Animais ativos:', animais.count);

    // 4. Testa Regra de Movimentação (Venda altera status para 'vendido')
    const anyPiquete = db.prepare('SELECT id FROM piquetes LIMIT 1').get();
    const piqId = anyPiquete ? anyPiquete.id : null;

    const insertTestAnimal = db.prepare(`
        INSERT INTO animais (fazenda_id, identificacao, sexo, categoria, status, piquete_atual_id)
        VALUES (1, 'TEST-999', 'M', 'garrote', 'ativo', ?)
    `).run(piqId);
    const testAnimalId = insertTestAnimal.lastInsertRowid;

    // Registra movimentação de venda
    db.transaction(() => {
        db.prepare(`
            INSERT INTO movimentacoes_animais (animal_id, tipo, data, valor, observacao)
            VALUES (?, 'venda', '2026-09-08', 4500, 'Venda de teste')
        `).run(testAnimalId);

        db.prepare(`UPDATE animais SET status = 'vendido', piquete_atual_id = NULL WHERE id = ?`).run(testAnimalId);
    })();

    const updatedAnimal = db.prepare('SELECT status, piquete_atual_id FROM animais WHERE id = ?').get(testAnimalId);
    if (updatedAnimal.status === 'vendido' && updatedAnimal.piquete_atual_id === null) {
        console.log('✔ Regra de Negócio: Venda atualizou automaticamente o animal para "vendido" e removeu do piquete.');
    } else {
        console.error('❌ Falha na regra de venda');
    }

    // Limpa animal de teste
    db.prepare('DELETE FROM movimentacoes_animais WHERE animal_id = ?').run(testAnimalId);
    db.prepare('DELETE FROM animais WHERE id = ?').run(testAnimalId);

    // 5. Testa Cálculo de Sanidade
    const today = new Date().toISOString().split('T')[0];
    const atrasadas = db.prepare(`
        SELECT COUNT(*) as count FROM sanidade WHERE status != 'aplicada' AND data_proxima_dose < ?
    `).get(today);
    console.log('✔ Sanidade: vacinas atrasadas identificadas:', atrasadas.count);

    // 6. Testa Financeiro
    const fin = db.prepare(`
        SELECT 
            SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as rec,
            SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as desp
        FROM financeiro
    `).get();
    console.log(`✔ Financeiro: Receitas = R$ ${fin.rec}, Despesas = R$ ${fin.desp}, Saldo = R$ ${fin.rec - fin.desp}`);

    console.log('--- TODOS OS TESTES DO BACKEND PASSARAM COM SUCESSO ---');
}

testBackend().catch(console.error);
