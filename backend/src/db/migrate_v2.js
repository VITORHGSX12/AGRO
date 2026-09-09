import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../agro.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF'); // Desativa temporariamente para reconstruir tabelas

console.log('[Migration V2] Iniciando migração do schema...');

const migrate = db.transaction(() => {
    // 1. Adiciona colunas de snapshot textual em movimentacoes_animais se não existirem
    const movCols = db.prepare(`PRAGMA table_info(movimentacoes_animais)`).all();
    const hasOrigemNome = movCols.some(c => c.name === 'piquete_origem_nome');
    const hasDestinoNome = movCols.some(c => c.name === 'piquete_destino_nome');

    if (!hasOrigemNome) {
        db.prepare(`ALTER TABLE movimentacoes_animais ADD COLUMN piquete_origem_nome TEXT`).run();
        console.log('✔ Coluna piquete_origem_nome adicionada em movimentacoes_animais');
    }
    if (!hasDestinoNome) {
        db.prepare(`ALTER TABLE movimentacoes_animais ADD COLUMN piquete_destino_nome TEXT`).run();
        console.log('✔ Coluna piquete_destino_nome adicionada em movimentacoes_animais');
    }

    // Preenche snapshots textuais retroativos para dados existentes
    db.prepare(`
        UPDATE movimentacoes_animais
        SET piquete_origem_nome = (SELECT nome FROM piquetes WHERE id = movimentacoes_animais.piquete_origem_id)
        WHERE piquete_origem_id IS NOT NULL AND piquete_origem_nome IS NULL
    `).run();

    db.prepare(`
        UPDATE movimentacoes_animais
        SET piquete_destino_nome = (SELECT nome FROM piquetes WHERE id = movimentacoes_animais.piquete_destino_id)
        WHERE piquete_destino_id IS NOT NULL AND piquete_destino_nome IS NULL
    `).run();

    // 2. Ajusta tabela animais para constraint UNIQUE(fazenda_id, identificacao)
    // Cria tabela nova temporária
    db.prepare(`
        CREATE TABLE IF NOT EXISTS animais_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
            identificacao TEXT NOT NULL,
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
        )
    `).run();

    // Copia dados existentes
    db.prepare(`
        INSERT OR IGNORE INTO animais_new 
        SELECT id, fazenda_id, identificacao, sexo, data_nascimento, raca, categoria, status, piquete_atual_id, peso_atual, observacoes, created_at
        FROM animais
    `).run();

    // Substitui tabela antiga
    db.prepare(`DROP TABLE animais`).run();
    db.prepare(`ALTER TABLE animais_new RENAME TO animais`).run();
    console.log('✔ Tabela animais atualizada para constraint UNIQUE(fazenda_id, identificacao)');
});

migrate();
db.pragma('foreign_keys = ON');
console.log('[Migration V2] Migração concluída com sucesso!');
