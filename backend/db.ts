import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  WARNING: DATABASE_URL is not defined. Database connections will fail.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // SSL is often required for cloud databases (Neon, Heroku, etc.)
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    (process as any).exit(-1);
});

export const db = {
    query: (text: string, params?: any[]): Promise<QueryResult> => pool.query(text, params),
    getClient: () => pool.connect(), 
};