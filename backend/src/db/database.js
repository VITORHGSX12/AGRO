import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configuredDbPath = process.env.DB_PATH;
const dbPath = configuredDbPath 
    ? path.resolve(process.cwd(), configuredDbPath) 
    : path.resolve(__dirname, '../../agro.db');

const db = new Database(dbPath);

// Ativa foreign keys e modo WAL para melhor concorrência
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Inicializa o schema
const schemaPath = path.resolve(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schemaSql);

// Migrações dinâmicas seguras (novas colunas)
try {
    const tableInfo = db.prepare("PRAGMA table_info(sanidade)").all();
    const cols = tableInfo.map(c => c.name);
    if (!cols.includes('dias_carencia')) {
        db.prepare("ALTER TABLE sanidade ADD COLUMN dias_carencia INTEGER DEFAULT 0").run();
    }
    if (!cols.includes('data_fim_carencia')) {
        db.prepare("ALTER TABLE sanidade ADD COLUMN data_fim_carencia TEXT").run();
    }
} catch (migErr) {
    console.warn('[DB Migration Warning]:', migErr.message);
}

console.log(`[DB] Banco de dados SQLite inicializado em: ${dbPath}`);

export default db;
