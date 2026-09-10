import db from './src/db/database.js';
import { hashPassword, comparePassword } from './src/utils/auth.js';

console.log('🧪 Iniciando Teste Automatizado de Equipe & RH + Usuários RBAC...');

// 1. Cadastrar Colaborador Fixo e Diarista
const funcFixoInsert = db.prepare(`
    INSERT INTO funcionarios (fazenda_id, nome, funcao, tipo_contratacao, salario, mora_na_fazenda, data_admissao, status)
    VALUES (1, 'Vaqueiro Teste Silva', 'Vaqueiro Líder', 'fixo', 3200.00, 1, '2025-01-10', 'ativo')
`).run();
const funcFixoId = funcFixoInsert.lastInsertRowid;

const funcDiaristaInsert = db.prepare(`
    INSERT INTO funcionarios (fazenda_id, nome, funcao, tipo_contratacao, valor_diaria, mora_na_fazenda, data_admissao, status)
    VALUES (1, 'Tratorista Diarista Teste', 'Operador Temporário', 'diarista', 180.00, 0, '2026-05-01', 'ativo')
`).run();
const funcDiaristaId = funcDiaristaInsert.lastInsertRowid;

console.log(`✅ 1. Colaboradores cadastrados: Fixo ID ${funcFixoId} (R$ 3.200) e Diarista ID ${funcDiaristaId} (R$ 180/dia)`);

// 2. Inicializar e Pagar Folha do Mês
const mesRef = '2026-09';
const folhaFixoInsert = db.prepare(`
    INSERT INTO folha_pagamento (funcionario_id, mes_referencia, salario_base, beneficios, descontos, valor_liquido, status)
    VALUES (?, ?, 3200.00, 300.00, 200.00, 3300.00, 'pendente')
`).run(funcFixoId, mesRef);
const folhaId = folhaFixoInsert.lastInsertRowid;

// Pagar folha e gerar despesa financeira
db.prepare(`UPDATE folha_pagamento SET status = 'pago', data_pagamento = '2026-09-05' WHERE id = ?`).run(folhaId);

const finFolha = db.prepare(`
    INSERT INTO financeiro (fazenda_id, tipo, categoria, atividade, valor, data, descricao)
    VALUES (1, 'despesa', 'salario', 'rh', 3300.00, '2026-09-05', 'Salário - Vaqueiro Teste Silva (Ref: 2026-09)')
`).run();
console.log(`✅ 2. Folha paga (R$ 3.300 líquido) com Despesa Financeira ID ${finFolha.lastInsertRowid} (Atividade: rh, Categoria: salario)`);

// 3. Teste de RBAC e Criptografia de Usuários
const senhaPlana = 'SegredoForte2026!';
const senhaHash = hashPassword(senhaPlana);
const senhaConfere = comparePassword(senhaPlana, senhaHash);

const userTestInsert = db.prepare(`
    INSERT INTO usuarios (fazenda_id, nome, email, senha_hash, papel, status)
    VALUES (1, 'Gerente Teste', 'gerente.teste@fazendagd.com', ?, 'gerente', 'ativo')
`).run(senhaHash);
const userTestId = userTestInsert.lastInsertRowid;

const userVerificado = db.prepare('SELECT id, nome, email, papel, status FROM usuarios WHERE id = ?').get(userTestId);
console.log(`✅ 3. Usuário RBAC criado: ID ${userVerificado.id}, Papel: ${userVerificado.papel}, Senha Criptografada BCrypt confere: ${senhaConfere}`);

if (senhaConfere && userVerificado.papel === 'gerente') {
    console.log('\n🎉 TODOS OS TESTES DE RH E RBAC PASSARAM COM SUCESSO!');
} else {
    console.error('\n❌ Falha nos testes de RH/RBAC!');
}

// Limpeza dos dados de teste
db.prepare('DELETE FROM usuarios WHERE id = ?').run(userTestId);
db.prepare('DELETE FROM financeiro WHERE id = ?').run(finFolha.lastInsertRowid);
db.prepare('DELETE FROM folha_pagamento WHERE id = ?').run(folhaId);
db.prepare('DELETE FROM funcionarios WHERE id IN (?, ?)').run(funcFixoId, funcDiaristaId);
console.log('🧹 Limpeza dos dados de teste de RH/RBAC concluída com sucesso.');
