import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPostgresPool } from './db/postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPostgresSchemaTests() {
    console.log('================================================================');
    console.log('🐘 TESTE DE SCHEMA & ADAPTADOR POSTGRESQL (FASE 4 - ETAPA 3)');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(cond, desc) {
        if (cond) {
            console.log(`  [PASS] ${desc}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${desc}`);
            failed++;
        }
    }

    try {
        const schemaPath = path.resolve(__dirname, 'db/schema_postgres.sql');
        assert(fs.existsSync(schemaPath), 'Arquivo backend/src/db/schema_postgres.sql existe');

        const sql = fs.readFileSync(schemaPath, 'utf8');

        // Lista de todas as 17 tabelas essenciais do sistema
        const expectedTables = [
            'fazenda',
            'piquetes',
            'animais',
            'movimentacoes_animais',
            'sanidade',
            'financeiro',
            'rotacao_pastagem',
            'arrendamentos_pastagem',
            'funcionarios',
            'folha_pagamento',
            'talhoes',
            'safras',
            'insumos_agricolas',
            'benfeitorias',
            'maquinas_equipamentos',
            'manutencoes',
            'usuarios'
        ];

        for (const table of expectedTables) {
            assert(sql.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `Tabela "${table}" definida no schema PostgreSQL`);
        }

        // Validação de tipos específicos do PostgreSQL (SERIAL, TIMESTAMP WITH TIME ZONE, DECIMAL)
        assert(sql.includes('SERIAL PRIMARY KEY'), 'Uso de SERIAL PRIMARY KEY para autoincremento seguro no Postgres');
        assert(sql.includes('TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'), 'Uso de TIMESTAMP WITH TIME ZONE para precisão temporal com fuso horário');
        assert(sql.includes('ON CONFLICT (email) DO NOTHING'), 'Cláusula ON CONFLICT padrão PostgreSQL para idempotência de usuários');
        assert(sql.includes('CREATE INDEX IF NOT EXISTS'), 'Índices de performance definidos para consultas frequentes');

    } catch (err) {
        console.error('Erro na validação do schema PostgreSQL:', err);
        failed++;
    }

    console.log('\n================================================================');
    console.log(` RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU`);
    console.log('================================================================\n');
}

runPostgresSchemaTests();
