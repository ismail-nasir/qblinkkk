
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
// Note: In a real app, import 'pool' from a db.ts file
import { Pool } from 'pg'; 

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Schema Validation
const SignupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    businessName: z.string().min(2)
});

// Register
authRouter.post('/signup', async (req, res) => {
    try {
        const { email, password, businessName } = SignupSchema.parse(req.body);

        // Check existing
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hash = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, business_name) VALUES ($1, $2, $3) RETURNING id, email, business_name, role',
            [email, hash, businessName]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ user, token });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Login
authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        
        // Remove hash from response
        delete user.password_hash;
        
        res.json({ user, token });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Middleware to protect routes
export const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
