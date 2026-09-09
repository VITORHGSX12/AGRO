import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../agro.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

console.log('[Migration Pastagens] Criando tabelas de rotação de pastagem e contratos de arrendamento...');

db.exec(`
    -- 1. Rotação de Pastagem (Linha do Tempo de Ocupação)
    CREATE TABLE IF NOT EXISTS rotacao_pastagem (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        piquete_id INTEGER NOT NULL REFERENCES piquetes(id) ON DELETE CASCADE,
        data_entrada TEXT NOT NULL,
        data_saida TEXT, -- NULL se ainda estiver no piquete
        quantidade_animais INTEGER DEFAULT 1,
        observacao TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Contratos de Arrendamento de Pasto (Pago / Recebido)
    CREATE TABLE IF NOT EXISTS contratos_arrendamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
        piquete_id INTEGER REFERENCES piquetes(id) ON DELETE SET NULL, -- NULL se for área externa
        tipo TEXT CHECK(tipo IN ('pago', 'recebido')) NOT NULL,
        contraparte_nome TEXT NOT NULL, -- Nome do proprietário ou locatário
        valor REAL NOT NULL,
        unidade_cobranca TEXT CHECK(unidade_cobranca IN ('por_cabeca_mes', 'por_hectare_mes', 'valor_fixo_mes')) NOT NULL,
        data_inicio TEXT NOT NULL,
        data_fim TEXT, -- NULL se em aberto
        status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'encerrado')),
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

console.log('[Migration Pastagens] Tabelas criadas com sucesso!');
