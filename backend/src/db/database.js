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

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`[DB] Conectando SQLite em: ${dbPath}`);
let db;
try {
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
} catch (err) {
    console.error('[DB FATAL] Erro ao abrir SQLite:', err);
    throw err;
}

import { hashPassword } from '../utils/auth.js';

// Inicializa o schema
const schemaPath = path.resolve(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schemaSql);

// Migrações dinâmicas de colunas
try {
    db.exec(`ALTER TABLE sanidade ADD COLUMN custo REAL DEFAULT 0;`);
} catch (e) {}

try {
    db.exec(`ALTER TABLE financeiro ADD COLUMN atividade TEXT DEFAULT 'geral';`);
} catch (e) {}

try {
    db.exec(`
        UPDATE financeiro 
        SET atividade = 'pecuaria' 
        WHERE categoria IN ('venda_animal', 'compra_animal', 'vacina_medicamento', 'nutricao_racao', 'aluguel_pasto', 'aluguel_pasto_pago', 'aluguel_pasto_recebido') 
          AND (atividade IS NULL OR atividade = 'geral');

        UPDATE financeiro 
        SET atividade = 'agricola' 
        WHERE categoria IN ('venda_agricola', 'insumo_agricola') 
          AND (atividade IS NULL OR atividade = 'geral');

        UPDATE financeiro 
        SET atividade = 'rh' 
        WHERE categoria IN ('salario') 
          AND (atividade IS NULL OR atividade = 'geral');
    `);
} catch (e) {}

// Seed automático de usuários e fazenda inicial
try {
    let fazenda = db.prepare('SELECT id FROM fazenda LIMIT 1').get();
    if (!fazenda) {
        const insFaz = db.prepare(`INSERT INTO fazenda (nome, area_hectares, localizacao) VALUES ('Fazenda GD', 1500, 'Mato Grosso do Sul')`).run();
        fazenda = { id: insFaz.lastInsertRowid };
    }

    // Garante que o usuário fazendagdapp sempre exista com a senha app2026@
    const existingMainUser = db.prepare(`SELECT id FROM usuarios WHERE LOWER(email) = 'fazendagdapp@agro.com' OR LOWER(nome) = 'fazendagdapp'`).get();
    if (!existingMainUser) {
        db.prepare(`
            INSERT INTO usuarios (fazenda_id, nome, email, senha_hash, papel, status)
            VALUES (?, 'fazendagdapp', 'fazendagdapp@agro.com', ?, 'dono', 'ativo')
        `).run(fazenda.id, hashPassword('app2026@'));
        console.log('[DB Seed] Usuário fazendagdapp criado com sucesso!');
    } else {
        db.prepare(`
            UPDATE usuarios 
            SET senha_hash = ?, status = 'ativo', papel = 'dono'
            WHERE id = ?
        `).run(hashPassword('app2026@'), existingMainUser.id);
        console.log('[DB Seed] Usuário fazendagdapp atualizado com a senha app2026@.');
    }

    const userCount = db.prepare('SELECT COUNT(*) as count FROM usuarios').get().count;
    if (userCount <= 1) {
        const insertUser = db.prepare(`
            INSERT INTO usuarios (fazenda_id, nome, email, senha_hash, papel, status)
            VALUES (?, ?, ?, ?, ?, 'ativo')
        `);
        insertUser.run(fazenda.id, 'Produtor Rural (Dono)', 'dono@agro.com', hashPassword('123456'), 'dono');
        insertUser.run(fazenda.id, 'Gerente Geral', 'gerente@agro.com', hashPassword('123456'), 'gerente');
        insertUser.run(fazenda.id, 'Contabilidade', 'contador@agro.com', hashPassword('123456'), 'contador');
    }

    // Seed de piquetes se vazio
    const piqCount = db.prepare('SELECT COUNT(*) as count FROM piquetes').get().count;
    if (piqCount === 0) {
        const insPiq = db.prepare(`INSERT INTO piquetes (fazenda_id, nome, tamanho_hectares, capacidade_suporte) VALUES (?, ?, ?, ?)`);
        insPiq.run(fazenda.id, 'Pasto 01 - Baixada', 50.0, 60);
        insPiq.run(fazenda.id, 'Pasto 02 - Sede', 35.0, 45);
        insPiq.run(fazenda.id, 'Pasto 03 - Retiro', 80.0, 100);
    }
} catch (seedErr) {
    console.warn('[DB Seed Warning]:', seedErr.message);
}

console.log(`[DB] Banco de dados SQLite inicializado em: ${dbPath}`);

export default db;
