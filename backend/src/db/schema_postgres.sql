-- ==============================================================================
-- SCHEMA POSTGRESQL - AGRO SAAS (PRODUÇÃO)
-- ==============================================================================

-- 1. Tabela: FAZENDA
CREATE TABLE IF NOT EXISTS fazenda (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    proprietario VARCHAR(255),
    area_hectares DECIMAL(10,2) DEFAULT 0,
    localizacao VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir Fazenda Inicial padrão se não existir
INSERT INTO fazenda (id, nome, proprietario, area_hectares, localizacao)
VALUES (1, 'Fazenda Modelo AgroSaaS', 'Produtor Rural Exemplo', 500.0, 'Mato Grosso / Brasil')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela: PIQUETES (Pastagens)
CREATE TABLE IF NOT EXISTS piquetes (
    id SERIAL PRIMARY KEY,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    area_hectares DECIMAL(10,2) NOT NULL,
    capacidade_suporte INTEGER DEFAULT 0,
    tipo_forrageira VARCHAR(100) DEFAULT 'Brachiaria Brizantha',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela: ANIMAIS (Rebanho)
CREATE TABLE IF NOT EXISTS animais (
    id SERIAL PRIMARY KEY,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    identificacao VARCHAR(50) NOT NULL,
    sexo VARCHAR(1) NOT NULL CHECK (sexo IN ('M', 'F')),
    data_nascimento DATE,
    raca VARCHAR(100),
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
        'bezerro', 'bezerra', 'novilha', 'novilho', 'garrote', 'vaca', 'touro', 'boi_gordo', 'outro'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'vendido', 'morto')),
    piquete_atual_id INTEGER REFERENCES piquetes(id) ON DELETE SET NULL,
    peso_atual DECIMAL(8,2),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_animais_fazenda_brinco UNIQUE (fazenda_id, identificacao)
);

-- 3.1 Tabela: HISTÓRICO DE PESAGENS & GMD
CREATE TABLE IF NOT EXISTS pesagens (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
    data_pesagem DATE NOT NULL,
    peso DECIMAL(8,2) NOT NULL,
    ganho_peso_kg DECIMAL(8,2) DEFAULT 0,
    gmd_kg_dia DECIMAL(6,3) DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela: MOVIMENTAÇÕES DE ANIMAIS
CREATE TABLE IF NOT EXISTS movimentacoes_animais (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('compra', 'venda', 'morte', 'transferencia')),
    data DATE NOT NULL,
    valor DECIMAL(12,2) DEFAULT 0,
    piquete_origem_id INTEGER REFERENCES piquetes(id) ON DELETE SET NULL,
    piquete_destino_id INTEGER REFERENCES piquetes(id) ON DELETE SET NULL,
    piquete_origem_nome VARCHAR(255),
    piquete_destino_nome VARCHAR(255),
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela: SANIDADE (Vacinas e Tratamentos)
CREATE TABLE IF NOT EXISTS sanidade (
    id SERIAL PRIMARY KEY,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    animal_id INTEGER REFERENCES animais(id) ON DELETE CASCADE,
    lote_ou_grupo VARCHAR(100),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('vacina', 'vermifugo', 'tratamento', 'outro')),
    nome_produto VARCHAR(255) NOT NULL,
    data_aplicacao DATE NOT NULL,
    data_proxima_dose DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aplicada')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela: FINANCEIRO (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS financeiro (
    id SERIAL PRIMARY KEY,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
        'venda_animal',
        'compra_animal',
        'venda_agricola',
        'insumo_agricola',
        'vacina_medicamento',
        'nutricao_racao',
        'salario',
        'aluguel_pasto',
        'aluguel_pasto_pago',
        'aluguel_pasto_recebido',
        'manutencao_infra',
        'manutencao_maquina',
        'combustivel',
        'servicos_terceiros',
        'outros'
    )),
    valor DECIMAL(12,2) NOT NULL,
    data DATE NOT NULL,
    descricao TEXT,
    animal_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela: ROTAÇÃO DE PASTAGEM
CREATE TABLE IF NOT EXISTS rotacao_pastagem (
    id SERIAL PRIMARY KEY,
    piquete_id INTEGER NOT NULL REFERENCES piquetes(id) ON DELETE CASCADE,
    data_entrada DATE NOT NULL,
    data_saida DATE,
    quantidade_animais INTEGER NOT NULL DEFAULT 0,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabela: ARRENDAMENTOS DE PASTAGEM
CREATE TABLE IF NOT EXISTS arrendamentos_pastagem (
    id SERIAL PRIMARY KEY,
    piquete_id INTEGER NOT NULL REFERENCES piquetes(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('pago', 'recebido')),
    valor_mensal DECIMAL(12,2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    arrendatario_ou_locador VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado')),
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabela: FUNCIONÁRIOS (RH)
CREATE TABLE IF NOT EXISTS funcionarios (
    id SERIAL PRIMARY KEY,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(20),
    funcao VARCHAR(100) NOT NULL,
    tipo_contrato VARCHAR(20) NOT NULL CHECK (tipo_contrato IN ('fixo', 'diarista', 'temporario')),
    salario_base DECIMAL(12,2) NOT NULL DEFAULT 0,
    data_admissao DATE NOT NULL,
    data_demissao DATE,
    mora_na_fazenda BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabela: FOLHA DE PAGAMENTO
CREATE TABLE IF NOT EXISTS folha_pagamento (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    mes_referencia VARCHAR(7) NOT NULL, -- Formato 'YYYY-MM'
    salario_bruto DECIMAL(12,2) NOT NULL,
    descontos DECIMAL(12,2) NOT NULL DEFAULT 0,
    adicionais DECIMAL(12,2) NOT NULL DEFAULT 0,
    salario_liquido DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
    data_pagamento DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_folha_funcionario_mes UNIQUE (funcionario_id, mes_referencia)
);

-- 11. Tabela: TALHÕES (Agrícola)
CREATE TABLE IF NOT EXISTS talhoes (
    id SERIAL PRIMARY KEY,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    area_hectares DECIMAL(10,2) NOT NULL,
    tipo_solo VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Tabela: SAFRAS
CREATE TABLE IF NOT EXISTS safras (
    id SERIAL PRIMARY KEY,
    talhao_id INTEGER NOT NULL REFERENCES talhoes(id) ON DELETE CASCADE,
    cultura VARCHAR(100) NOT NULL,
    data_plantio DATE NOT NULL,
    data_colheita_prevista DATE,
    data_colheita_real DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'plantio' CHECK (status IN ('planejamento', 'plantio', 'desenvolvimento', 'colhido', 'cancelado')),
    area_plantada_ha DECIMAL(10,2) NOT NULL,
    producao_total_kg DECIMAL(12,2),
    producao_total_sacas DECIMAL(10,2),
    valor_venda_total DECIMAL(12,2),
    comprador VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Tabela: INSUMOS AGRÍCOLAS
CREATE TABLE IF NOT EXISTS insumos_agricolas (
    id SERIAL PRIMARY KEY,
    safra_id INTEGER NOT NULL REFERENCES safras(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('semente', 'adubo', 'defensivo', 'combustivel', 'servico', 'outro')),
    nome_produto VARCHAR(255) NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    custo_unitario DECIMAL(12,2) NOT NULL,
    custo_total DECIMAL(12,2) NOT NULL,
    data_aplicacao DATE NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Tabela: BENFEITORIAS (Patrimônio)
CREATE TABLE IF NOT EXISTS benfeitorias (
    id SERIAL PRIMARY KEY,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('curral', 'sede', 'cerca', 'poco_artesiano', 'galpao', 'represa', 'outro')),
    valor_aquisicao DECIMAL(12,2) NOT NULL,
    data_construcao DATE NOT NULL,
    vida_util_anos INTEGER NOT NULL DEFAULT 20,
    estado_conservacao VARCHAR(50) DEFAULT 'bom' CHECK (estado_conservacao IN ('otimo', 'bom', 'regular', 'ruim')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Tabela: MÁQUINAS E EQUIPAMENTOS
CREATE TABLE IF NOT EXISTS maquinas_equipamentos (
    id SERIAL PRIMARY KEY,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('trator', 'colheitadeira', 'plantadeira', 'pulverizador', 'veiculo', 'implemento', 'gerador', 'outro')),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    ano_fabricacao INTEGER,
    valor_aquisicao DECIMAL(12,2) NOT NULL,
    data_aquisicao DATE NOT NULL,
    vida_util_anos INTEGER NOT NULL DEFAULT 10,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'em_manutencao', 'baixado', 'vendido')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Tabela: MANUTENÇÕES DE PATRIMÔNIO
CREATE TABLE IF NOT EXISTS manutencoes (
    id SERIAL PRIMARY KEY,
    tipo_ativo VARCHAR(20) NOT NULL CHECK (tipo_ativo IN ('maquina', 'benfeitoria')),
    ativo_id INTEGER NOT NULL,
    data DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('preventiva', 'corretiva', 'reforma')),
    descricao TEXT NOT NULL,
    custo DECIMAL(12,2) NOT NULL,
    prestador_servico VARCHAR(255),
    proxima_manutencao DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Tabela: USUÁRIOS & PERMISSÕES (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    papel VARCHAR(20) NOT NULL CHECK (papel IN ('dono', 'gerente', 'contador')),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir Usuário Dono Inicial Padrão no PostgreSQL se a tabela estiver vazia
INSERT INTO usuarios (fazenda_id, nome, email, senha_hash, papel, status)
VALUES (
    1,
    'Produtor Rural (Dono)',
    'dono@agro.com',
    '33b5a7a13d6a2f8d83a152ca45bd9949:46e13369a4563a3d532b2b1d643fe7d6ee2bf2f3844f2d37c8ee47683935db03660fb6ba85942f9d51965a3cfba9829e06e3009b0b1fe784daee79a9ef1c29e7',
    'dono',
    'ativo'
) ON CONFLICT (email) DO NOTHING;

-- ÍNDICES PARA ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_animais_fazenda_status ON animais(fazenda_id, status);
CREATE INDEX IF NOT EXISTS idx_financeiro_fazenda_data ON financeiro(fazenda_id, data);
CREATE INDEX IF NOT EXISTS idx_sanidade_fazenda_proxima ON sanidade(fazenda_id, data_proxima_dose);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_animal_data ON movimentacoes_animais(animal_id, data);
CREATE INDEX IF NOT EXISTS idx_folha_mes ON folha_pagamento(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_safras_status ON safras(status);
