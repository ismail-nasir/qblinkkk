import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { AuthRequest } from '../middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export class AuthController {
    // Register new user
    static async signup(req: Request, res: Response) {
        const { email, password, businessName } = req.body;
        
        // Check if user exists
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });

        const hash = await bcrypt.hash(password, 10);
        
        // Auto-assign superadmin role for specific email (DEMO ONLY)
        const role = email === 'ismailnsm75@gmail.com' ? 'superadmin' : 'owner';
        
        const result = await db.query(
            'INSERT INTO users (email, password_hash, business_name, role, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, business_name, role, is_verified',
            [email, hash, businessName, role, true] // Auto-verify for simplicity
        );
        
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ user, token });
    }

    // Login user
    static async login(req: Request, res: Response) {
        const { email, password } = req.body;
        
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        
        // Remove sensitive data
        delete user.password_hash;
        delete user.verification_code;

        res.json({ user, token });
    }

    static async logout(req: Request, res: Response) {
        // Client should clear token. Server can blacklist token if using Redis.
        res.json({ message: 'Logged out successfully' });
    }

    static async deleteAccount(req: AuthRequest, res: Response) {
        await db.query('DELETE FROM users WHERE id = $1', [req.user?.id]);
        res.json({ message: 'Account deleted' });
    }

    // Stubs for verification flow
    static async verify(req: Request, res: Response) { res.json({ message: 'Verified' }); }
    static async resendVerification(req: Request, res: Response) { res.json({ message: 'Code sent' }); }
    static async forgotPassword(req: Request, res: Response) { res.json({ message: 'Reset link sent' }); }
    static async resetPassword(req: Request, res: Response) { res.json({ message: 'Password reset successful' }); }
}
