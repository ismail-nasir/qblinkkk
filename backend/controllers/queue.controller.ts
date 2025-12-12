
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
        const { name, estimatedWaitTime, location, businessType, features } = req.body;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Ensure features and businessType are stored if supported by DB schema, 
        // or just store basic info if schema is limited. 
        // Assuming schema has JSONB columns for flexibility or similar structure based on mock.
        // For standard SQL without JSON columns, we might need a separate table or just stick to basics.
        // Here we assume a robust schema or ignore if columns don't exist in minimal setup.
        
        const result = await db.query(
            'INSERT INTO queues (user_id, name, code, estimated_wait_time, location, business_type, features) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [req.user?.id, name, code, estimatedWaitTime || 5, location || null, businessType || 'general', features ? JSON.stringify(features) : null]
        );
        res.json(result.rows[0]);
    }

    static async getQueueData(req: Request, res: Response) {
        const data = await QueueService.getQueueData(req.params.id);
        res.json(data);
    }

    static async getQueueInfo(req: Request, res: Response) {
        const result = await db.query('SELECT * FROM queues WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Queue not found' });
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

    static async updateQueue(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const { settings, logo } = req.body;
        
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

    static async deleteQueue(req: AuthRequest, res: Response) {
        await db.query('DELETE FROM queues WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    }

    static async handleAlert(req: Request, res: Response) { 
        const { visitorId, type } = req.body;
        const isAlerting = type === 'trigger';
        await db.query(`UPDATE visitors SET is_alerting = $1 WHERE id = $2`, [isAlerting, visitorId]);
        getIO().to(req.params.id).emit('queue:update');
        res.json({success:true});
    }

    static async leaveQueue(req: Request, res: Response) { 
        await db.query(`UPDATE visitors SET status = 'cancelled' WHERE id = $1`, [req.body.visitorId]);
        getIO().to(req.params.id).emit('queue:update');
        res.json({success:true}); 
    }

    static async clearQueue(req: AuthRequest, res: Response) { 
        await db.query(`UPDATE visitors SET status = 'cancelled' WHERE queue_id = $1 AND status = 'waiting'`, [req.params.id]);
        getIO().to(req.params.id).emit('queue:update');
        res.json({success:true});
    }

    static async reorder(req: AuthRequest, res: Response) { 
        res.json({success:true});
    }

    static async recall(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const { visitorId } = req.body;
        await db.query(`UPDATE visitors SET status = 'served', is_alerting = FALSE WHERE queue_id = $1 AND status = 'serving'`, [id]);
        await db.query(`UPDATE visitors SET status = 'serving', is_alerting = TRUE WHERE id = $1`, [visitorId]);
        getIO().to(id).emit('queue:update');
        res.json({success:true});
    }

    static async takeBack(req: AuthRequest, res: Response) {
        await db.query(`UPDATE visitors SET status = 'waiting', is_alerting = FALSE WHERE queue_id = $1 AND status = 'serving'`, [req.params.id]);
        getIO().to(req.params.id).emit('queue:update');
        res.json({success:true});
    }

    static async callByNumber(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const { ticketNumber } = req.body;
        await db.query(`UPDATE visitors SET status = 'served', is_alerting = FALSE WHERE queue_id = $1 AND status = 'serving'`, [id]);
        const visitor = await db.query(`SELECT id FROM visitors WHERE queue_id = $1 AND ticket_number = $2`, [id, ticketNumber]);
        if (visitor.rows.length > 0) {
             await db.query(`UPDATE visitors SET status = 'serving', is_alerting = TRUE WHERE id = $1`, [visitor.rows[0].id]);
             getIO().to(id).emit('queue:update');
        }
        res.json({success:true});
    }
}
