import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../agro.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

console.log('[Migration Patrimônio] Criando tabelas do módulo de patrimônio e atualizando categorias financeiras...');

const migrate = db.transaction(() => {
    // 1. Cria tabela benfeitorias
    db.prepare(`
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
        )
    `).run();
    console.log('✔ Tabela benfeitorias criada.');

    // 2. Cria tabela maquinas_equipamentos
    db.prepare(`
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
        )
    `).run();
    console.log('✔ Tabela maquinas_equipamentos criada.');

    // 3. Cria tabela manutencoes
    db.prepare(`
        CREATE TABLE IF NOT EXISTS manutencoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            maquina_id INTEGER NOT NULL REFERENCES maquinas_equipamentos(id) ON DELETE CASCADE,
            data TEXT NOT NULL,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
    console.log('✔ Tabela manutencoes criada.');

    // 4. Atualiza tabela financeiro para incluir 'manutencao_maquina'
    db.prepare(`
        CREATE TABLE IF NOT EXISTS financeiro_patrimonio (
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
        )
    `).run();

    db.prepare(`
        INSERT OR IGNORE INTO financeiro_patrimonio
        SELECT id, fazenda_id, tipo, categoria, valor, data, descricao, animal_id, created_at
        FROM financeiro
    `).run();

    db.prepare(`DROP TABLE financeiro`).run();
    db.prepare(`ALTER TABLE financeiro_patrimonio RENAME TO financeiro`).run();
    console.log('✔ Tabela financeiro atualizada com categoria manutencao_maquina.');
});

migrate();
db.pragma('foreign_keys = ON');
console.log('[Migration Patrimônio] Migração concluída com sucesso!');
