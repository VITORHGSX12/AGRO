import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../agro.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

console.log('[Migration Financeiro CHECK] Atualizando categorias da tabela financeiro...');

const migrate = db.transaction(() => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS financeiro_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
            tipo TEXT CHECK(tipo IN ('receita', 'despesa')) NOT NULL,
            categoria TEXT CHECK(categoria IN (
                'venda_animal',
                'compra_animal',
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
});

migrate();
db.pragma('foreign_keys = ON');
console.log('✔ Tabela financeiro atualizada com sucesso!');
