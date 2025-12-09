
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from './db';
import { authenticate } from './middleware';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

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
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hash = await bcrypt.hash(password, 10);
        // Default role is 'owner'. Root admin check is manual or via seed.
        // For demo: if email is the root admin, make them superadmin
        const role = email === 'ismailnsm75@gmail.com' ? 'superadmin' : 'owner';
        
        const result = await db.query(
            'INSERT INTO users (email, password_hash, business_name, role, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, business_name, role, is_verified',
            [email, hash, businessName, role, true] // Auto-verify for demo simplicity
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
        
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        
        delete user.password_hash;
        delete user.verification_code;
        
        res.json({ user, token });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Verify Email (Stub for demo, can be expanded with Nodemailer)
authRouter.post('/verify', async (req, res) => {
    const { email, code } = req.body;
    // In real app: check code against db
    if (code !== '123456') return res.status(400).json({ error: 'Invalid code' });

    await db.query('UPDATE users SET is_verified = TRUE WHERE email = $1', [email]);
    
    const result = await db.query('SELECT id, email, business_name, role, is_verified FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user, token });
});

// Resend Verification (Stub)
authRouter.post('/resend-verification', (req, res) => {
    res.json({ message: 'Code sent' });
});

// Forgot Password (Stub)
authRouter.post('/forgot-password', async (req, res) => {
    // In real app: generate token, save to DB, send email
    res.json({ message: 'Reset link sent' });
});

// Reset Password
authRouter.post('/reset-password', async (req, res) => {
    const { email, code, password } = req.body;
    if (code !== '123456') return res.status(400).json({ error: 'Invalid code' });

    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);

    res.json({ message: 'Password reset successful' });
});

// Logout (Client handles token removal)
authRouter.post('/logout', (req, res) => {
    res.json({ message: 'Logged out' });
});

// Delete My Account
authRouter.delete('/me', authenticate, async (req: any, res) => {
    await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account deleted' });
});
