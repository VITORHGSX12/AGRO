import db from './src/db/database.js';

console.log('🧪 Iniciando Teste Automatizado de Ciclo Agrícola...');

// 1. Criar talhão de teste
const talhaoInsert = db.prepare(`
    INSERT INTO talhoes (fazenda_id, nome, area_hectares, tipo_solo)
    VALUES (1, 'Talhão Teste Automatizado A1', 50.0, 'Argiloso')
`).run();
const talhaoId = talhaoInsert.lastInsertRowid;
console.log(`✅ 1. Talhão criado com sucesso: ID ${talhaoId} (50 ha)`);

// 2. Criar Safra de Soja
const safraInsert = db.prepare(`
    INSERT INTO safras (talhao_id, cultura, data_plantio, data_colheita_prevista, status, observacoes)
    VALUES (?, 'Soja Transgênica', '2026-10-15', '2027-02-28', 'plantio', 'Plantio direto de teste')
`).run(talhaoId);
const safraId = safraInsert.lastInsertRowid;
console.log(`✅ 2. Safra criada com sucesso: ID ${safraId}`);

// 3. Lançar Insumo com integração financeira
const insumoInsert = db.prepare(`
    INSERT INTO insumos_agricolas (safra_id, tipo, descricao, quantidade, valor, data)
    VALUES (?, 'fertilizante', 'NPK 04-14-08 (10 ton)', 10, 18500.00, '2026-10-20')
`).run(safraId);
const insumoId = insumoInsert.lastInsertRowid;

const finInsumo = db.prepare(`
    INSERT INTO financeiro (fazenda_id, tipo, categoria, atividade, valor, data, descricao)
    VALUES (1, 'despesa', 'insumo_agricola', 'agricola', 18500.00, '2026-10-20', 'Insumo Safra Soja Transgênica: NPK 04-14-08 (10 ton)')
`).run();
console.log(`✅ 3. Insumo registrado: ID ${insumoId} (R$ 18.500) e Despesa Financeira ID ${finInsumo.lastInsertRowid} (Atividade: agricola)`);

// 4. Mudar estágio para em desenvolvimento
db.prepare('UPDATE safras SET status = ? WHERE id = ?').run('em_desenvolvimento', safraId);
console.log('✅ 4. Safra atualizada para em_desenvolvimento');

// 5. Registrar Colheita e Fechamento com Receita Financeira
const qtdColhida = 3200; // 3.200 sacas em 50 ha = 64 sc/ha
const valorVenda = 416000.00; // R$ 130/sc
db.prepare(`
    UPDATE safras SET
        status = 'colhida',
        data_colheita_real = '2027-03-01',
        quantidade_colhida = ?,
        unidade_medida = 'sacas',
        valor_venda_total = ?
    WHERE id = ?
`).run(qtdColhida, valorVenda, safraId);

const finColheita = db.prepare(`
    INSERT INTO financeiro (fazenda_id, tipo, categoria, atividade, valor, data, descricao)
    VALUES (1, 'receita', 'venda_agricola', 'agricola', ?, '2027-03-01', 'Venda Agrícola - Soja Transgênica (3200 sacas, Talhão Teste Automatizado A1)')
`).run(valorVenda);
console.log(`✅ 5. Colheita registrada (3.200 sacas = 64 sc/ha) e Receita Financeira ID ${finColheita.lastInsertRowid} (R$ 416.000, Atividade: agricola)`);

// 6. Validar consultas e KPIs
const safraEnriched = db.prepare(`
    SELECT 
        s.*,
        t.nome as talhao_nome,
        t.area_hectares as talhao_area,
        COALESCE((SELECT SUM(i.valor) FROM insumos_agricolas i WHERE i.safra_id = s.id), 0) as total_custo_insumos
    FROM safras s
    JOIN talhoes t ON s.talhao_id = t.id
    WHERE s.id = ?
`).get(safraId);

const produtividadeHa = Number((safraEnriched.quantidade_colhida / safraEnriched.talhao_area).toFixed(2));
const custoPorHa = Number((safraEnriched.total_custo_insumos / safraEnriched.talhao_area).toFixed(2));
const receitaPorHa = Number((safraEnriched.valor_venda_total / safraEnriched.talhao_area).toFixed(2));
const lucroBruto = safraEnriched.valor_venda_total - safraEnriched.total_custo_insumos;
const lucroPorHa = Number((lucroBruto / safraEnriched.talhao_area).toFixed(2));

console.log('\n📊 Indicadores Calculados:');
console.log(`- Produtividade: ${produtividadeHa} sc/ha (Esperado: 64 sc/ha)`);
console.log(`- Custo por Ha: R$ ${custoPorHa} (Esperado: R$ 370)`);
console.log(`- Receita por Ha: R$ ${receitaPorHa} (Esperado: R$ 8.320)`);
console.log(`- Lucro Bruto: R$ ${lucroBruto} (Esperado: R$ 397.500)`);
console.log(`- Lucro por Ha: R$ ${lucroPorHa} (Esperado: R$ 7.950)`);

if (produtividadeHa === 64 && custoPorHa === 370 && receitaPorHa === 8320 && lucroBruto === 397500) {
    console.log('\n🎉 TODOS OS CÁLCULOS ESTÃO 100% EXATOS!');
} else {
    console.error('\n❌ Divergência nos cálculos!');
}

// Limpeza dos dados de teste
db.prepare('DELETE FROM financeiro WHERE id IN (?, ?)').run(finInsumo.lastInsertRowid, finColheita.lastInsertRowid);
db.prepare('DELETE FROM insumos_agricolas WHERE id = ?').run(insumoId);
db.prepare('DELETE FROM safras WHERE id = ?').run(safraId);
db.prepare('DELETE FROM talhoes WHERE id = ?').run(talhaoId);
console.log('🧹 Limpeza dos dados de teste concluída com sucesso.');
