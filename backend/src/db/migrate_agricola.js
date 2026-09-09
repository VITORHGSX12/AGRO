import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../agro.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

console.log('[Migration Agrícola] Criando tabelas do módulo agrícola e atualizando categorias financeiras...');

const migrate = db.transaction(() => {
    // 1. Cria tabela talhoes
    db.prepare(`
        CREATE TABLE IF NOT EXISTS talhoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            area_hectares REAL NOT NULL,
            tipo_solo TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
    console.log('✔ Tabela talhoes criada.');

    // 2. Cria tabela safras
    db.prepare(`
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
        )
    `).run();
    console.log('✔ Tabela safras criada.');

    // 3. Cria tabela insumos_agricolas
    db.prepare(`
        CREATE TABLE IF NOT EXISTS insumos_agricolas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            safra_id INTEGER NOT NULL REFERENCES safras(id) ON DELETE CASCADE,
            tipo TEXT CHECK(tipo IN ('semente', 'fertilizante', 'defensivo', 'outro')) NOT NULL,
            descricao TEXT NOT NULL,
            quantidade REAL,
            valor REAL NOT NULL,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
    console.log('✔ Tabela insumos_agricolas criada.');

    // 4. Atualiza tabela financeiro para suportar 'insumo_agricola' e 'venda_agricola'
    db.prepare(`
        CREATE TABLE IF NOT EXISTS financeiro_new (
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
        INSERT OR IGNORE INTO financeiro_new
        SELECT id, fazenda_id, tipo, categoria, valor, data, descricao, animal_id, created_at
        FROM financeiro
    `).run();

    db.prepare(`DROP TABLE financeiro`).run();
    db.prepare(`ALTER TABLE financeiro_new RENAME TO financeiro`).run();
    console.log('✔ Tabela financeiro atualizada com categorias agrícolas.');
});

migrate();
db.pragma('foreign_keys = ON');
console.log('[Migration Agrícola] Migração concluída com sucesso!');
