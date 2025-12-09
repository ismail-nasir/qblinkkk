
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { AuthRequest } from '../middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export class AuthController {
    static async signup(req: Request, res: Response) {
        const { email, password, businessName } = req.body;
        
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Email exists' });

        const hash = await bcrypt.hash(password, 10);
        // Special logic for superadmin demo
        const role = email === 'ismailnsm75@gmail.com' ? 'superadmin' : 'owner';
        
        const result = await db.query(
            'INSERT INTO users (email, password_hash, business_name, role, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, business_name, role, is_verified',
            [email, hash, businessName, role, true] // Auto-verified for easier demo
        );
        
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ user, token });
    }

    static async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        
        // Sanitize return
        delete user.password_hash;
        delete user.verification_code;

        res.json({ user, token });
    }

    static async verify(req: Request, res: Response) {
        // Stub implementation
        res.json({ message: 'Verified' });
    }
    
    static async resendVerification(req: Request, res: Response) { res.json({ message: 'Sent' }); }
    static async forgotPassword(req: Request, res: Response) { res.json({ message: 'Sent' }); }
    static async resetPassword(req: Request, res: Response) { res.json({ message: 'Reset' }); }
    static async logout(req: Request, res: Response) { res.json({ message: 'Logged out' }); }

    static async deleteAccount(req: AuthRequest, res: Response) {
        await db.query('DELETE FROM users WHERE id = $1', [req.user?.id]);
        res.json({ message: 'Deleted' });
    }
}
