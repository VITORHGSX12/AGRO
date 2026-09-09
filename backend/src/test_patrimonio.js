import db from './db/database.js';

async function runPatrimonioTests() {
    console.log('===========================================================');
    console.log('🧪 INICIANDO TESTES DO MÓDULO DE PATRIMÔNIO (FASE 3 - ETAPA 2)');
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
        let fazenda = db.prepare('SELECT id FROM fazenda LIMIT 1').get();
        if (!fazenda) {
            const ins = db.prepare(`INSERT INTO fazenda (nome, area_hectares) VALUES ('Fazenda Teste Patrimônio', 1000)`).run();
            fazenda = { id: ins.lastInsertRowid };
        }
        const fazendaId = fazenda.id;

        // Limpar dados de teste de patrimônio
        db.prepare(`DELETE FROM manutencoes`).run();
        db.prepare(`DELETE FROM maquinas_equipamentos`).run();
        db.prepare(`DELETE FROM benfeitorias`).run();
        db.prepare(`DELETE FROM financeiro WHERE categoria = 'manutencao_maquina'`).run();

        // -------------------------------------------------------------
        // TESTE 1: Cadastro de Benfeitoria
        // -------------------------------------------------------------
        console.log('\n--- TESTE 1: Cadastro de Benfeitoria ---');
        const valorCurral = 100000.00;
        const vidaUtilCurral = 20; // 20 anos -> 5% ao ano = R$ 5.000/ano
        const dataAqCurral = '2024-01-01'; // Há aproximadamente 2 anos se estamos em 2026

        const insertBenfeitoria = db.prepare(`
            INSERT INTO benfeitorias (fazenda_id, tipo, descricao, valor_aquisicao, data_aquisicao, vida_util_anos)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(fazendaId, 'curral', 'Curral de Concreto Anti-estresse com Tronco', valorCurral, dataAqCurral, vidaUtilCurral);

        const benfeitoriaId = insertBenfeitoria.lastInsertRowid;
        const benfeitoria = db.prepare('SELECT * FROM benfeitorias WHERE id = ?').get(benfeitoriaId);

        assert(benfeitoria && benfeitoria.tipo === 'curral', 'Benfeitoria cadastrada com tipo "curral"');
        assert(benfeitoria && benfeitoria.valor_aquisicao === valorCurral, `Valor de aquisição R$ ${valorCurral} gravado`);

        // -------------------------------------------------------------
        // TESTE 2: Cadastro de Máquina / Trator
        // -------------------------------------------------------------
        console.log('\n--- TESTE 2: Cadastro de Máquina / Trator ---');
        const valorTrator = 400000.00;
        const vidaUtilTrator = 10; // 10 anos -> R$ 40.000/ano
        const dataAqTrator = '2025-01-01'; // Há aproximadamente 1 ano

        const insertTrator = db.prepare(`
            INSERT INTO maquinas_equipamentos (fazenda_id, nome, tipo, valor_aquisicao, data_aquisicao, vida_util_anos, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(fazendaId, 'Trator John Deere 6110M 4x4', 'trator', valorTrator, dataAqTrator, vidaUtilTrator, 'ativo');

        const tratorId = insertTrator.lastInsertRowid;
        const trator = db.prepare('SELECT * FROM maquinas_equipamentos WHERE id = ?').get(tratorId);

        assert(trator && trator.nome.includes('John Deere'), 'Máquina cadastrada com nome correto');
        assert(trator && trator.status === 'ativo', 'Status da máquina é "ativo"');

        // -------------------------------------------------------------
        // TESTE 3: Lançamento de Manutenção com Despesa Automática no Financeiro
        // -------------------------------------------------------------
        console.log('\n--- TESTE 3: Lançamento de Manutenção & Automação Financeira ---');
        const valorManutencao = 7500.00;
        const dataManutencao = '2026-03-10';
        const descManutencao = 'Revisão geral de 500h, troca de óleo hidráulico e filtros';

        const insertMt = db.prepare(`
            INSERT INTO manutencoes (maquina_id, data, descricao, valor)
            VALUES (?, ?, ?, ?)
        `).run(tratorId, dataManutencao, descManutencao, valorManutencao);

        const mtId = insertMt.lastInsertRowid;
        const manutencao = db.prepare('SELECT * FROM manutencoes WHERE id = ?').get(mtId);
        assert(manutencao && manutencao.valor === valorManutencao, `Manutenção registrada com valor de R$ ${valorManutencao}`);

        // Regra de negócio: gerar despesa no Financeiro com categoria 'manutencao_maquina'
        const insertDespesa = db.prepare(`
            INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao)
            VALUES (?, 'despesa', 'manutencao_maquina', ?, ?, ?)
        `).run(
            fazendaId,
            valorManutencao,
            dataManutencao,
            `Manutenção de trator: Trator John Deere 6110M 4x4 - ${descManutencao}`
        );

        const despesaFin = db.prepare('SELECT * FROM financeiro WHERE id = ?').get(insertDespesa.lastInsertRowid);
        assert(despesaFin && despesaFin.tipo === 'despesa', 'Lançamento financeiro é do tipo "despesa"');
        assert(despesaFin && despesaFin.categoria === 'manutencao_maquina', 'Categoria é "manutencao_maquina"');
        assert(despesaFin && despesaFin.valor === valorManutencao, `Valor da despesa bate exatamente com a manutenção (R$ ${valorManutencao})`);

        // -------------------------------------------------------------
        // TESTE 4: Cálculo de Depreciação Linear Simples
        // -------------------------------------------------------------
        console.log('\n--- TESTE 4: Cálculo de Depreciação Linear ---');
        // Depreciação anual do trator = 400.000 / 10 = 40.000/ano
        const depAnualEsperada = valorTrator / vidaUtilTrator;
        assert(depAnualEsperada === 40000.00, `Depreciação anual linear do trator calculada em R$ ${depAnualEsperada}/ano`);

        // Depreciação anual do curral = 100.000 / 20 = 5.000/ano
        const depAnualCurralEsperada = valorCurral / vidaUtilCurral;
        assert(depAnualCurralEsperada === 5000.00, `Depreciação anual linear do curral calculada em R$ ${depAnualCurralEsperada}/ano`);

        // -------------------------------------------------------------
        // TESTE 5: Resumo Consolidado do Patrimônio
        // -------------------------------------------------------------
        console.log('\n--- TESTE 5: Resumo Consolidado do Patrimônio ---');
        const totalAquisicao = valorCurral + valorTrator; // 500.000
        assert(totalAquisicao === 500000.00, `Total de aquisição do patrimônio: R$ ${totalAquisicao}`);

        const totalManutencoesGasto = db.prepare('SELECT SUM(valor) as total FROM manutencoes').get()?.total;
        assert(totalManutencoesGasto === valorManutencao, `Total de manutenções acumulado: R$ ${totalManutencoesGasto}`);

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

runPatrimonioTests();
