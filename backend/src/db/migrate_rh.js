import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../agro.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

console.log('[Migration RH] Expandindo tabela funcionarios e criando tabela folha_pagamento...');

const migrate = db.transaction(() => {
    // 1. Recria tabela funcionarios com os novos campos
    db.prepare(`
        CREATE TABLE IF NOT EXISTS funcionarios_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fazenda_id INTEGER NOT NULL REFERENCES fazenda(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            funcao TEXT,
            tipo_contratacao TEXT CHECK(tipo_contratacao IN ('fixo', 'diarista')) DEFAULT 'fixo',
            salario REAL DEFAULT 0,
            valor_diaria REAL DEFAULT 0,
            mora_na_fazenda INTEGER DEFAULT 0,
            data_admissao TEXT,
            data_desligamento TEXT,
            status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'desligado')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Copia dados existentes
    const oldRows = db.prepare(`SELECT * FROM funcionarios`).all();
    const insertNew = db.prepare(`
        INSERT INTO funcionarios_new (id, fazenda_id, nome, funcao, tipo_contratacao, salario, valor_diaria, mora_na_fazenda, data_admissao, status, created_at)
        VALUES (@id, @fazenda_id, @nome, @funcao, 'fixo', @salario, 0, 1, @data_admissao, @status, @created_at)
    `);

    for (const r of oldRows) {
        insertNew.run({
            id: r.id,
            fazenda_id: r.fazenda_id,
            nome: r.nome,
            funcao: r.funcao,
            salario: r.salario || 0,
            data_admissao: r.data_admissao,
            status: r.status === 'inativo' ? 'desligado' : (r.status || 'ativo'),
            created_at: r.created_at || new Date().toISOString()
        });
    }

    db.prepare(`DROP TABLE funcionarios`).run();
    db.prepare(`ALTER TABLE funcionarios_new RENAME TO funcionarios`).run();
    console.log('✔ Tabela funcionarios expandida com sucesso!');

    // 2. Cria tabela folha_pagamento
    db.prepare(`
        CREATE TABLE IF NOT EXISTS folha_pagamento (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
            mes_referencia TEXT NOT NULL, -- 'YYYY-MM'
            salario_base REAL NOT NULL,
            beneficios REAL DEFAULT 0,
            descontos REAL DEFAULT 0,
            valor_liquido REAL NOT NULL,
            status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente', 'pago')),
            data_pagamento TEXT,
            observacoes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(funcionario_id, mes_referencia)
        )
    `).run();
    console.log('✔ Tabela folha_pagamento criada com sucesso!');
});

migrate();
db.pragma('foreign_keys = ON');
console.log('[Migration RH] Migração concluída com sucesso!');
