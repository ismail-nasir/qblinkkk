
import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { db } from '../db';

export class AdminController {

    static async getAllUsers(req: AuthRequest, res: Response) {
        const result = await db.query(
            'SELECT id, email, business_name, role, is_verified, created_at as "joinedAt" FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    }

    static async getSystemLogs(req: AuthRequest, res: Response) {
        const result = await db.query(`
            SELECT 
                l.action_type as action, 
                l.timestamp as time, 
                v.ticket_number as ticket,
                u.business_name as user,
                u.email
            FROM queue_logs l
            JOIN queues q ON l.queue_id = q.id
            JOIN users u ON q.user_id = u.id
            LEFT JOIN visitors v ON l.visitor_id = v.id
            ORDER BY l.timestamp DESC LIMIT 100
        `);
        // Format time for frontend
        const logs = result.rows.map(row => ({
            ...row,
            time: new Date(row.time).toLocaleString()
        }));
        res.json(logs);
    }

    static async getAuditLogs(req: AuthRequest, res: Response) {
        const result = await db.query('SELECT * FROM admin_audit_logs ORDER BY timestamp DESC LIMIT 50');
        res.json(result.rows);
    }

    static async logAction(req: AuthRequest, res: Response) {
        const { adminEmail, action, target } = req.body;
        await db.query(
            'INSERT INTO admin_audit_logs (admin_email, action, target) VALUES ($1, $2, $3)',
            [adminEmail, action, target]
        );
        res.json({ success: true });
    }

    static async getAdmins(req: AuthRequest, res: Response) {
        const result = await db.query("SELECT email FROM users WHERE role IN ('admin', 'superadmin')");
        res.json(result.rows.map(r => r.email));
    }

    static async addAdmin(req: AuthRequest, res: Response) {
        const { email } = req.body;
        await db.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
        // Audit log
        await db.query(
            'INSERT INTO admin_audit_logs (admin_email, action, target) VALUES ($1, $2, $3)',
            [req.user?.email, 'Add Admin', email]
        );
        res.json({ success: true });
    }

    static async removeAdmin(req: AuthRequest, res: Response) {
        const { email } = req.body;
        if (email === 'ismailnsm75@gmail.com') return res.status(403).json({ error: 'Cannot remove root admin' });
        
        await db.query("UPDATE users SET role = 'owner' WHERE email = $1", [email]);
        // Audit log
        await db.query(
            'INSERT INTO admin_audit_logs (admin_email, action, target) VALUES ($1, $2, $3)',
            [req.user?.email, 'Remove Admin', email]
        );
        res.json({ success: true });
    }
}
