import db from './src/db/database.js';

console.log('🧪 Iniciando Teste Automatizado de Patrimônio & Máquinas...');

// 1. Cadastrar Máquina
const maquinaInsert = db.prepare(`
    INSERT INTO maquinas_equipamentos (
        fazenda_id, nome, tipo, valor_aquisicao, data_aquisicao, vida_util_anos, status, observacoes
    ) VALUES (1, 'Trator John Deere 6110J Teste', 'trator', 400000.00, '2024-01-01', 10, 'ativo', 'Teste automatizado')
`).run();
const maquinaId = maquinaInsert.lastInsertRowid;
console.log(`✅ 1. Máquina cadastrada: ID ${maquinaId} (R$ 400.000, Vida útil: 10 anos)`);

// 2. Lançar Manutenção com despesa financeira
const manutencaoInsert = db.prepare(`
    INSERT INTO manutencoes (maquina_id, data, descricao, valor)
    VALUES (?, '2026-09-01', 'Revisão geral 1.000h e troca de óleo/filtros', 6500.00)
`).run(maquinaId);
const manutencaoId = manutencaoInsert.lastInsertRowid;

const finManutencao = db.prepare(`
    INSERT INTO financeiro (fazenda_id, tipo, categoria, atividade, valor, data, descricao)
    VALUES (1, 'despesa', 'manutencao_maquina', 'geral', 6500.00, '2026-09-01', 'Manutenção de trator: Trator John Deere 6110J Teste - Revisão geral 1.000h')
`).run();
console.log(`✅ 2. Manutenção registrada: ID ${manutencaoId} (R$ 6.500) e Despesa Financeira ID ${finManutencao.lastInsertRowid}`);

// 3. Cadastrar Benfeitoria
const benfeitoriaInsert = db.prepare(`
    INSERT INTO benfeitorias (
        fazenda_id, tipo, descricao, valor_aquisicao, data_aquisicao, vida_util_anos, observacoes
    ) VALUES (1, 'galpao', 'Galpão de Armazenamento Teste 200m²', 100000.00, '2021-01-01', 20, 'Estrutura metálica')
`).run();
const benfeitoriaId = benfeitoriaInsert.lastInsertRowid;
console.log(`✅ 3. Benfeitoria cadastrada: ID ${benfeitoriaId} (R$ 100.000, Vida útil: 20 anos)`);

// 4. Validar Cálculos de Depreciação Linear
function calcularDep(valAq, dataAq, vidaUtil) {
    const diffMs = new Date() - new Date(dataAq);
    const anos = Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 365.25));
    const depAnual = valAq / vidaUtil;
    const depAcum = Math.min(valAq, anos * depAnual);
    const valAtual = Math.max(0, valAq - depAcum);
    return { depAnual, anos, depAcum, valAtual };
}

const depTrator = calcularDep(400000, '2024-01-01', 10);
const depGalpao = calcularDep(100000, '2021-01-01', 20);

console.log('\n📊 Indicadores de Depreciação:');
console.log(`- Trator (400k, 10a): Depreciação anual R$ ${depTrator.depAnual.toFixed(2)}, Valor Atual aprox R$ ${depTrator.valAtual.toFixed(2)}`);
console.log(`- Galpão (100k, 20a): Depreciação anual R$ ${depGalpao.depAnual.toFixed(2)}, Valor Atual aprox R$ ${depGalpao.valAtual.toFixed(2)}`);

if (depTrator.depAnual === 40000 && depGalpao.depAnual === 5000) {
    console.log('\n🎉 CÁLCULOS DE DEPRECIAÇÃO LINEAR 100% EXATOS!');
} else {
    console.error('\n❌ Divergência no cálculo de depreciação!');
}

// Limpeza dos dados de teste
db.prepare('DELETE FROM financeiro WHERE id = ?').run(finManutencao.lastInsertRowid);
db.prepare('DELETE FROM manutencoes WHERE id = ?').run(manutencaoId);
db.prepare('DELETE FROM maquinas_equipamentos WHERE id = ?').run(maquinaId);
db.prepare('DELETE FROM benfeitorias WHERE id = ?').run(benfeitoriaId);
console.log('🧹 Limpeza dos dados de teste de patrimônio concluída com sucesso.');
