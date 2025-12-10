import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Connection config handles both local development strings and cloud URLs
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false, // Required for Heroku/Render/Neon
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    (process as any).exit(-1);
});

export const db = {
    query: (text: string, params?: any[]): Promise<QueryResult> => pool.query(text, params),
    getClient: () => pool.connect(),
};