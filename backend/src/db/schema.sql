-- Schema do Banco de Dados SQLite para MVP SaaS de Gestão de Fazendas (V2)

PRAGMA foreign_keys = ON;

-- 1. Fazenda (Cadastro da Propriedade)
CREATE TABLE IF NOT EXISTS fazenda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    area_hectares REAL DEFAULT 0,
    localizacao TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Piquetes / Pastos
CREATE TABLE IF NOT EXISTS piquetes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tamanho_hectares REAL DEFAULT 0,
    capacidade_suporte INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Animais (Rebanho) - Unicidade por Fazenda
CREATE TABLE IF NOT EXISTS animais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    identificacao TEXT NOT NULL, -- Número do brinco / tatuagem
    sexo TEXT CHECK(sexo IN ('M', 'F')) NOT NULL,
    data_nascimento TEXT,
    raca TEXT,
    categoria TEXT CHECK(categoria IN ('bezerro', 'bezerra', 'novilha', 'novilho', 'vaca', 'touro', 'garrote', 'boi_gordo', 'outro')) NOT NULL,
    status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'vendido', 'morto')),
    piquete_atual_id INTEGER REFERENCES piquetes(id) ON DELETE SET NULL,
    peso_atual REAL,
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fazenda_id, identificacao)
);

-- 4. Movimentações de Animais com Snapshot Textual de Nomes de Piquetes
CREATE TABLE IF NOT EXISTS movimentacoes_animais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
    tipo TEXT CHECK(tipo IN ('compra', 'venda', 'morte', 'transferencia')) NOT NULL,
    data TEXT NOT NULL,
    valor REAL DEFAULT 0,
    piquete_origem_id INTEGER REFERENCES piquetes(id) ON DELETE SET NULL,
    piquete_destino_id INTEGER REFERENCES piquetes(id) ON DELETE SET NULL,
    piquete_origem_nome TEXT, -- Snapshot histórico
    piquete_destino_nome TEXT, -- Snapshot histórico
    observacao TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Sanidade (Vacinações, Vermífugos e Tratamentos)
CREATE TABLE IF NOT EXISTS sanidade (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    animal_id INTEGER REFERENCES animais(id) ON DELETE CASCADE, -- NULL se for aplicação coletiva
    lote_ou_grupo TEXT, -- ex: 'Todo o Rebanho', 'Bezerros Lote 1'
    tipo TEXT CHECK(tipo IN ('vacina', 'vermifugo', 'tratamento', 'outro')) NOT NULL,
    nome_produto TEXT NOT NULL,
    data_aplicacao TEXT NOT NULL,
    data_proxima_dose TEXT,
    status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente', 'aplicada', 'atrasada')),
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Financeiro (Receitas e Despesas)
CREATE TABLE IF NOT EXISTS financeiro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    tipo TEXT CHECK(tipo IN ('receita', 'despesa')) NOT NULL,
    categoria TEXT CHECK(categoria IN (
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
    )) NOT NULL,
    valor REAL NOT NULL,
    data TEXT NOT NULL,
    descricao TEXT,
    animal_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    funcao TEXT,
    salario REAL DEFAULT 0,
    data_admissao TEXT,
    status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo', 'desligado')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Rotação de Pastagem (Histórico de Ocupação e Lotação)
CREATE TABLE IF NOT EXISTS rotacao_pastagem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    piquete_id INTEGER NOT NULL REFERENCES piquetes(id) ON DELETE CASCADE,
    data_entrada TEXT NOT NULL,
    data_saida TEXT, -- NULL se ainda estiver no piquete
    quantidade_animais INTEGER DEFAULT 1,
    observacao TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Contratos de Arrendamento de Pasto (Pago / Recebido)
CREATE TABLE IF NOT EXISTS contratos_arrendamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    piquete_id INTEGER REFERENCES piquetes(id) ON DELETE SET NULL,
    tipo TEXT CHECK(tipo IN ('pago', 'recebido')) NOT NULL,
    contraparte_nome TEXT NOT NULL,
    valor REAL NOT NULL,
    unidade_cobranca TEXT CHECK(unidade_cobranca IN ('por_cabeca_mes', 'por_hectare_mes', 'valor_fixo_mes')) NOT NULL,
    data_inicio TEXT NOT NULL,
    data_fim TEXT,
    status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'encerrado')),
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Talhões (Áreas de Lavoura/Cultura)
CREATE TABLE IF NOT EXISTS talhoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    area_hectares REAL NOT NULL,
    tipo_solo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Safras (Culturas e Ciclos de Produção)
CREATE TABLE IF NOT EXISTS safras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    talhao_id INTEGER NOT NULL REFERENCES talhoes(id) ON DELETE CASCADE,
    cultura TEXT NOT NULL,
    data_plantio TEXT NOT NULL,
    data_colheita_prevista TEXT,
    data_colheita_real TEXT,
    quantidade_colhida REAL,
    unidade_medida TEXT CHECK(unidade_medida IN ('sacas', 'toneladas')) DEFAULT 'sacas',
    status TEXT CHECK(status IN ('plantio', 'em_desenvolvimento', 'colhida')) DEFAULT 'plantio',
    valor_venda_total REAL DEFAULT 0,
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Insumos Agrícolas (Sementes, Fertilizantes, Defensivos)
CREATE TABLE IF NOT EXISTS insumos_agricolas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    safra_id INTEGER NOT NULL REFERENCES safras(id) ON DELETE CASCADE,
    tipo TEXT CHECK(tipo IN ('semente', 'fertilizante', 'defensivo', 'outro')) NOT NULL,
    descricao TEXT NOT NULL,
    quantidade REAL,
    valor REAL NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Benfeitorias (Construções, Estruturas e Instalações)
CREATE TABLE IF NOT EXISTS benfeitorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    tipo TEXT CHECK(tipo IN ('casa_sede', 'casa_caseiro', 'curral', 'galpao', 'cerca', 'poco', 'outro')) NOT NULL,
    descricao TEXT NOT NULL,
    valor_aquisicao REAL NOT NULL,
    data_aquisicao TEXT NOT NULL,
    vida_util_anos INTEGER NOT NULL,
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Máquinas e Equipamentos (Tratores, Implementos, Veículos)
CREATE TABLE IF NOT EXISTS maquinas_equipamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('trator', 'implemento', 'veiculo', 'outro')) NOT NULL,
    valor_aquisicao REAL NOT NULL,
    data_aquisicao TEXT NOT NULL,
    vida_util_anos INTEGER NOT NULL,
    status TEXT CHECK(status IN ('ativo', 'em_manutencao', 'vendido')) DEFAULT 'ativo',
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Manutenções de Máquinas e Equipamentos
CREATE TABLE IF NOT EXISTS manutencoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    maquina_id INTEGER NOT NULL REFERENCES maquinas_equipamentos(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Usuários do Sistema e Controle de Acesso (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    papel TEXT CHECK(papel IN ('dono', 'gerente', 'contador')) NOT NULL DEFAULT 'dono',
    status TEXT CHECK(status IN ('ativo', 'inativo')) NOT NULL DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);



