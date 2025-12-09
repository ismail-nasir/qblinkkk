
import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Max clients in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    (process as any).exit(-1);
});

export const db = {
    query: (text: string, params?: any[]): Promise<QueryResult> => pool.query(text, params),
    getClient: () => pool.connect(), // For transactions
};
