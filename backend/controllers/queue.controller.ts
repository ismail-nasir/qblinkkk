
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware';
import { db } from '../db';
import { QueueService } from '../services/queue.service';
import { getIO } from '../socket';

export class QueueController {
    static async getUserQueues(req: AuthRequest, res: Response) {
        const result = await db.query('SELECT * FROM queues WHERE user_id = $1 ORDER BY created_at DESC', [req.user?.id]);
        res.json(result.rows);
    }

    static async createQueue(req: AuthRequest, res: Response) {
        const { name, estimatedWaitTime } = req.body;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const result = await db.query(
            'INSERT INTO queues (user_id, name, code, estimated_wait_time) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user?.id, name, code, estimatedWaitTime || 5]
        );
        res.json(result.rows[0]);
    }

    static async getQueueData(req: Request, res: Response) {
        const data = await QueueService.getQueueData(req.params.id);
        res.json(data);
    }

    static async getQueueInfo(req: Request, res: Response) {
        const result = await db.query('SELECT * FROM queues WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    }

    static async joinQueue(req: Request, res: Response) {
        const { queueId, name } = req.body;
        const visitor = await QueueService.joinQueue(queueId, name);
        const data = await QueueService.getQueueData(queueId);
        res.json({ visitor, queueData: data });
    }

    static async callNext(req: AuthRequest, res: Response) {
        const visitor = await QueueService.callNext(req.params.id, req.user?.id!);
        res.json(visitor);
    }

    static async deleteQueue(req: AuthRequest, res: Response) {
        await db.query('DELETE FROM queues WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    }

    static async updateQueue(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const { name, settings, logo } = req.body;
        
        // Build dynamic query
        // For simplicity in this dump, updating settings & logo
        if (settings) {
            await db.query('UPDATE queues SET settings = $1 WHERE id = $2', [settings, id]);
        }
        if (logo) {
            await db.query('UPDATE queues SET logo = $1 WHERE id = $2', [logo, id]);
        }
        
        const updated = await db.query('SELECT * FROM queues WHERE id = $1', [id]);
        getIO().to(id).emit('queue:update', { type: 'settings' });
        res.json(updated.rows[0]);
    }
    
    // Auxiliary stubs for full implementation completeness
    static async leaveQueue(req: Request, res: Response) { 
        await db.query(`UPDATE visitors SET status = 'cancelled' WHERE id = $1`, [req.body.visitorId]);
        getIO().to(req.params.id).emit('queue:update');
        res.json({success:true}); 
    }
    static async handleAlert(req: Request, res: Response) { 
        const { visitorId, type } = req.body;
        const isAlerting = type === 'trigger';
        await db.query(`UPDATE visitors SET is_alerting = $1 WHERE id = $2`, [isAlerting, visitorId]);
        getIO().to(req.params.id).emit('queue:update');
        res.json({success:true});
    }
    static async callByNumber(req: AuthRequest, res: Response) { /* Implement similar to callNext but with specific ticket query */ res.json({}); }
    static async recall(req: AuthRequest, res: Response) { /* Implement recall logic */ res.json({}); }
    static async takeBack(req: AuthRequest, res: Response) { /* Implement takeBack */ res.json({}); }
    static async clearQueue(req: AuthRequest, res: Response) { 
        await db.query(`UPDATE visitors SET status = 'cancelled' WHERE queue_id = $1 AND status = 'waiting'`, [req.params.id]);
        getIO().to(req.params.id).emit('queue:update');
        res.json({success:true});
    }
    static async reorder(req: AuthRequest, res: Response) { 
        // Logic to update ticket numbers or dedicated 'order' column
        res.json({success:true});
    }
}
