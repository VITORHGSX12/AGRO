import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;

export function getPostgresPool() {
    if (!pool && process.env.DATABASE_URL) {
        const isProduction = process.env.NODE_ENV === 'production';
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: isProduction || process.env.DATABASE_URL.includes('sslmode=require') 
                ? { rejectUnauthorized: false } 
                : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        pool.on('error', (err) => {
            console.error('[PostgreSQL Pool Error]', err);
        });
    }
    return pool;
}

export async function initPostgresSchema() {
    const currentPool = getPostgresPool();
    if (!currentPool) {
        throw new Error('DATABASE_URL não configurada no ambiente para PostgreSQL');
    }

    const schemaPath = path.resolve(__dirname, 'schema_postgres.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    const client = await currentPool.connect();
    try {
        await client.query(schemaSql);
        console.log('[PostgreSQL] Schema de produção inicializado com sucesso.');
    } finally {
        client.release();
    }
}

export default {
    getPostgresPool,
    initPostgresSchema
};
