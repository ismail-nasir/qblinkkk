import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// connectionString should be in the format: postgres://user:password@host:port/database
// Most cloud providers (Render, Heroku, Railway) provide this as DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false, // Required for secure cloud connections
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const db = {
    query: (text: string, params?: any[]): Promise<QueryResult> => pool.query(text, params),
    getClient: () => pool.connect(),
};
