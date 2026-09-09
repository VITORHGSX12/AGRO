import db from './database.js';

console.log('[Seed] Populando banco de dados com dados iniciais...');

// Limpa dados existentes para reset limpo
db.exec(`
    DELETE FROM rotacao_pastagem;
    DELETE FROM contratos_arrendamento;
    DELETE FROM financeiro;
    DELETE FROM sanidade;
    DELETE FROM movimentacoes_animais;
    DELETE FROM animais;
    DELETE FROM piquetes;
    DELETE FROM funcionarios;
    DELETE FROM fazenda;
    DELETE FROM sqlite_sequence;
`);

// 1. Cadastrar Fazenda
const insertFazenda = db.prepare(`
    INSERT INTO fazenda (id, nome, area_hectares, localizacao)
    VALUES (1, 'Fazenda Santa Maria', 1250.0, 'Mato Grosso do Sul - MS')
`);
insertFazenda.run();

// 2. Cadastrar Piquetes
const insertPiquete = db.prepare(`
    INSERT INTO piquetes (id, fazenda_id, nome, tamanho_hectares, capacidade_suporte)
    VALUES (@id, @fazenda_id, @nome, @tamanho_hectares, @capacidade_suporte)
`);

const piquetesData = [
    { id: 1, fazenda_id: 1, nome: 'Pasto 01 - Maternidade (Brachiaria)', tamanho_hectares: 45.0, capacidade_suporte: 60 },
    { id: 2, fazenda_id: 1, nome: 'Pasto 02 - Recria Novilhas (Mombaça)', tamanho_hectares: 80.0, capacidade_suporte: 110 },
    { id: 3, fazenda_id: 1, nome: 'Pasto 03 - Engorda Bois (Piatã)', tamanho_hectares: 120.0, capacidade_suporte: 160 },
    { id: 4, fazenda_id: 1, nome: 'Pasto 04 - Retiro Bezerros (Tifton)', tamanho_hectares: 35.0, capacidade_suporte: 50 }
];

for (const p of piquetesData) {
    insertPiquete.run(p);
}

// 3. Cadastrar Animais
const insertAnimal = db.prepare(`
    INSERT INTO animais (id, fazenda_id, identificacao, sexo, data_nascimento, raca, categoria, status, piquete_atual_id, peso_atual, observacoes)
    VALUES (@id, @fazenda_id, @identificacao, @sexo, @data_nascimento, @raca, @categoria, @status, @piquete_atual_id, @peso_atual, @observacoes)
`);

const animaisData = [
    { id: 1, fazenda_id: 1, identificacao: 'BR-1001', sexo: 'F', data_nascimento: '2022-04-10', raca: 'Nelore', categoria: 'vaca', status: 'ativo', piquete_atual_id: 1, peso_atual: 470, observacoes: 'Matriz PO, pariu recentemente' },
    { id: 2, fazenda_id: 1, identificacao: 'BR-1002', sexo: 'M', data_nascimento: '2024-02-15', raca: 'Nelore', categoria: 'bezerro', status: 'ativo', piquete_atual_id: 1, peso_atual: 140, observacoes: 'Filho da vaca BR-1001' },
    { id: 3, fazenda_id: 1, identificacao: 'BR-1003', sexo: 'M', data_nascimento: '2023-01-20', raca: 'Angus x Nelore', categoria: 'garrote', status: 'ativo', piquete_atual_id: 3, peso_atual: 360, observacoes: 'Cruzamento industrial' },
    { id: 4, fazenda_id: 1, identificacao: 'BR-1004', sexo: 'M', data_nascimento: '2022-08-11', raca: 'Nelore', categoria: 'boi_gordo', status: 'ativo', piquete_atual_id: 3, peso_atual: 530, observacoes: 'Pronto para abate/venda' },
    { id: 5, fazenda_id: 1, identificacao: 'BR-1005', sexo: 'F', data_nascimento: '2023-05-18', raca: 'Senepol', categoria: 'novilha', status: 'ativo', piquete_atual_id: 2, peso_atual: 310, observacoes: 'Doadora futura' },
    { id: 6, fazenda_id: 1, identificacao: 'BR-1006', sexo: 'M', data_nascimento: '2021-10-05', raca: 'Nelore', categoria: 'touro', status: 'ativo', piquete_atual_id: 2, peso_atual: 790, observacoes: 'Reprodutor principal' },
    { id: 7, fazenda_id: 1, identificacao: 'BR-1007', sexo: 'F', data_nascimento: '2022-09-01', raca: 'Nelore', categoria: 'novilha', status: 'vendido', piquete_atual_id: null, peso_atual: 410, observacoes: 'Vendida em leilão regional' },
    { id: 8, fazenda_id: 1, identificacao: 'BR-1008', sexo: 'M', data_nascimento: '2023-03-12', raca: 'Nelore', categoria: 'bezerro', status: 'morto', piquete_atual_id: null, peso_atual: 120, observacoes: 'Morte por picada de cobra' }
];

for (const a of animaisData) {
    insertAnimal.run(a);
}

// 4. Cadastrar Movimentações
const insertMov = db.prepare(`
    INSERT INTO movimentacoes_animais (animal_id, tipo, data, valor, piquete_origem_id, piquete_destino_id, piquete_origem_nome, piquete_destino_nome, observacao)
    VALUES (@animal_id, @tipo, @data, @valor, @piquete_origem_id, @piquete_destino_id, @piquete_origem_nome, @piquete_destino_nome, @observacao)
`);

const movsData = [
    { animal_id: 1, tipo: 'compra', data: '2022-06-10', valor: 6500.0, piquete_origem_id: null, piquete_destino_id: 1, piquete_origem_nome: null, piquete_destino_nome: 'Pasto 01 - Maternidade (Brachiaria)', observacao: 'Aquisição de matriz PO' },
    { animal_id: 3, tipo: 'transferencia', data: '2024-03-01', valor: 0, piquete_origem_id: 4, piquete_destino_id: 3, piquete_origem_nome: 'Pasto 04 - Retiro Bezerros (Tifton)', piquete_destino_nome: 'Pasto 03 - Engorda Bois (Piatã)', observacao: 'Mudança de piquete para engorda' },
    { animal_id: 7, tipo: 'venda', data: '2024-04-15', valor: 5200.0, piquete_origem_id: 2, piquete_destino_id: null, piquete_origem_nome: 'Pasto 02 - Recria Novilhas (Mombaça)', piquete_destino_nome: null, observacao: 'Venda direta para confinamento parceiro' },
    { animal_id: 8, tipo: 'morte', data: '2024-05-02', valor: 0, piquete_origem_id: 4, piquete_destino_id: null, piquete_origem_nome: 'Pasto 04 - Retiro Bezerros (Tifton)', piquete_destino_nome: null, observacao: 'Óbito no piquete 04' }
];

for (const m of movsData) {
    insertMov.run(m);
}

// 5. Cadastrar Rotação de Pastagem
const insertRotacao = db.prepare(`
    INSERT INTO rotacao_pastagem (piquete_id, data_entrada, data_saida, quantidade_animais, observacao)
    VALUES (@piquete_id, @data_entrada, @data_saida, @quantidade_animais, @observacao)
`);

const rotacaoData = [
    { piquete_id: 3, data_entrada: '2024-03-01', data_saida: null, quantidade_animais: 2, observacao: 'Entrada de garrotes e bois em terminação' },
    { piquete_id: 4, data_entrada: '2024-01-10', data_saida: '2024-03-01', quantidade_animais: 3, observacao: 'Período de recria inicial' },
    { piquete_id: 1, data_entrada: '2024-02-01', data_saida: null, quantidade_animais: 2, observacao: 'Lote de matrizes com cria ao pé' }
];

for (const r of rotacaoData) {
    insertRotacao.run(r);
}

// 6. Cadastrar Contratos de Arrendamento
const insertArrend = db.prepare(`
    INSERT INTO contratos_arrendamento (fazenda_id, piquete_id, tipo, contraparte_nome, valor, unidade_cobranca, data_inicio, data_fim, status, observacoes)
    VALUES (@fazenda_id, @piquete_id, @tipo, @contraparte_nome, @valor, @unidade_cobranca, @data_inicio, @data_fim, @status, @observacoes)
`);

const arrendData = [
    { fazenda_id: 1, piquete_id: 2, tipo: 'pago', contraparte_nome: 'Antônio Prado (Fazenda Vizinha)', valor: 65.0, unidade_cobranca: 'por_hectare_mes', data_inicio: '2026-01-01', data_fim: null, status: 'ativo', observacoes: 'Arrendamento de pasto adjacente para novilhas' },
    { fazenda_id: 1, piquete_id: null, tipo: 'recebido', contraparte_nome: 'Agropecuária Boi Gordo Ltda', valor: 4500.0, unidade_cobranca: 'valor_fixo_mes', data_inicio: '2026-02-01', data_fim: '2026-12-31', status: 'ativo', observacoes: 'Cessão de área de confinamento' }
];

for (const ar of arrendData) {
    insertArrend.run(ar);
}

// 7. Cadastrar Sanidade
const insertSanidade = db.prepare(`
    INSERT INTO sanidade (fazenda_id, animal_id, lote_ou_grupo, tipo, nome_produto, data_aplicacao, data_proxima_dose, status, observacoes)
    VALUES (@fazenda_id, @animal_id, @lote_ou_grupo, @tipo, @nome_produto, @data_aplicacao, @data_proxima_dose, @status, @observacoes)
`);

const today = new Date();
const formatDate = (d) => d.toISOString().split('T')[0];

const pastDate = new Date(today);
pastDate.setDate(today.getDate() - 180);

const dateAtrasada = new Date(today);
dateAtrasada.setDate(today.getDate() - 10);

const dateVencendo7Dias = new Date(today);
dateVencendo7Dias.setDate(today.getDate() + 4);

const dateFutura = new Date(today);
dateFutura.setDate(today.getDate() + 120);

const sanidadeData = [
    { fazenda_id: 1, animal_id: null, lote_ou_grupo: 'Todo o Rebanho', tipo: 'vacina', nome_produto: 'Vacina Febre Aftosa Bivalente', data_aplicacao: formatDate(pastDate), data_proxima_dose: formatDate(dateAtrasada), status: 'atrasada', observacoes: 'Campanha oficial obrigatória' },
    { fazenda_id: 1, animal_id: 3, lote_ou_grupo: null, tipo: 'vermifugo', nome_produto: 'Ivermectina 3.15%', data_aplicacao: formatDate(pastDate), data_proxima_dose: formatDate(dateVencendo7Dias), status: 'pendente', observacoes: 'Dose de reforço para recria' },
    { fazenda_id: 1, animal_id: 1, lote_ou_grupo: null, tipo: 'vacina', nome_produto: 'Vacina Clostridiose (Polivalente)', data_aplicacao: formatDate(pastDate), data_proxima_dose: formatDate(dateFutura), status: 'aplicada', observacoes: 'Aplicação anual de rotina' }
];

for (const s of sanidadeData) {
    insertSanidade.run(s);
}

// 8. Cadastrar Financeiro
const insertFinanceiro = db.prepare(`
    INSERT INTO financeiro (fazenda_id, tipo, categoria, valor, data, descricao, animal_id)
    VALUES (@fazenda_id, @tipo, @categoria, @valor, @data, @descricao, @animal_id)
`);

const financeiroData = [
    { fazenda_id: 1, tipo: 'receita', categoria: 'venda_animal', valor: 5200.0, data: '2026-08-15', descricao: 'Venda de novilha BR-1007', animal_id: 7 },
    { fazenda_id: 1, tipo: 'receita', categoria: 'venda_animal', valor: 14500.0, data: '2026-09-02', descricao: 'Venda de lote de bezerros desmamados', animal_id: null },
    { fazenda_id: 1, tipo: 'receita', categoria: 'aluguel_pasto_recebido', valor: 4500.0, data: '2026-09-05', descricao: 'Recebimento Arrendamento Pasto - Agropecuária Boi Gordo Ltda', animal_id: null },
    { fazenda_id: 1, tipo: 'despesa', categoria: 'vacina_medicamento', valor: 1350.0, data: '2026-08-20', descricao: 'Compra de vacinas e antibióticos', animal_id: null },
    { fazenda_id: 1, tipo: 'despesa', categoria: 'nutricao_racao', valor: 3800.0, data: '2026-09-01', descricao: 'Sal mineral e ração suplementar', animal_id: null },
    { fazenda_id: 1, tipo: 'despesa', categoria: 'combustivel', valor: 850.0, data: '2026-09-05', descricao: 'Diesel para trator de manutenção de pasto', animal_id: null },
    { fazenda_id: 1, tipo: 'despesa', categoria: 'salario', valor: 4500.0, data: '2026-09-05', descricao: 'Folha de pagamento da equipe campeira', animal_id: null },
    { fazenda_id: 1, tipo: 'despesa', categoria: 'aluguel_pasto_pago', valor: 5200.0, data: '2026-09-05', descricao: 'Pagamento Arrendamento Pasto - Antônio Prado (80 ha x R$ 65)', animal_id: null }
];

for (const f of financeiroData) {
    insertFinanceiro.run(f);
}

// 9. Cadastrar Funcionários
const insertFunc = db.prepare(`
    INSERT INTO funcionarios (fazenda_id, nome, funcao, salario, data_admissao, status)
    VALUES (@fazenda_id, @nome, @funcao, @salario, @data_admissao, @status)
`);

const funcData = [
    { fazenda_id: 1, nome: 'Sebastião Alves', funcao: 'Capataz Geral', salario: 3000.0, data_admissao: '2021-03-01', status: 'ativo' },
    { fazenda_id: 1, nome: 'José da Silva', funcao: 'Tratorista / Campeiro', salario: 2200.0, data_admissao: '2022-06-15', status: 'ativo' }
];

for (const fn of funcData) {
    insertFunc.run(fn);
}

console.log('[Seed] Banco de dados populado com sucesso (Pastagens e Arrendamentos inclusos)!');
