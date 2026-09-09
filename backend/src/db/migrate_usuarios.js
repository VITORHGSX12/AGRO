import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from '../utils/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../agro.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

console.log('[Migration Usuários] Criando tabela usuarios e seedando perfis padrão...');

// 1. Cria tabela usuarios
db.prepare(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        papel TEXT CHECK(papel IN ('dono', 'gerente', 'contador')) NOT NULL DEFAULT 'dono',
        status TEXT CHECK(status IN ('ativo', 'inativo')) NOT NULL DEFAULT 'ativo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

console.log('✔ Tabela usuarios pronta.');

// 2. Garante fazenda existente
let fazenda = db.prepare('SELECT id FROM fazenda LIMIT 1').get();
if (!fazenda) {
    const ins = db.prepare(`INSERT INTO fazenda (nome, area_hectares) VALUES ('Fazenda Santa Maria', 1200)`).run();
    fazenda = { id: ins.lastInsertRowid };
}

const defaultUsers = [
    {
        nome: 'fazendagdapp',
        email: 'fazendagdapp@agro.com',
        senha: 'app2026@',
        papel: 'dono'
    },
    {
        nome: 'Produtor Rural (Dono)',
        email: 'dono@agro.com',
        senha: '123456',
        papel: 'dono'
    },
    {
        nome: 'Marcos Gerente Geral',
        email: 'gerente@agro.com',
        senha: '123456',
        papel: 'gerente'
    },
    {
        nome: 'Ana Contabilidade',
        email: 'contador@agro.com',
        senha: '123456',
        papel: 'contador'
    }
];

const insertUser = db.prepare(`
    INSERT OR IGNORE INTO usuarios (fazenda_id, nome, email, senha_hash, papel, status)
    VALUES (?, ?, ?, ?, ?, 'ativo')
`);

for (const u of defaultUsers) {
    const senhaHash = hashPassword(u.senha);
    insertUser.run(fazenda.id, u.nome, u.email, senhaHash, u.papel);
    console.log(`✔ Usuário garantido: ${u.email} [${u.papel}]`);
}

console.log('[Migration Usuários] Concluída com sucesso!');
