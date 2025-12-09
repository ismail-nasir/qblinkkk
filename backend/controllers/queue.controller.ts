
import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { QueueService } from '../services/queue.service';
import { db } from '../db';

export class QueueController {

    // GET /api/queue
    static async getUserQueues(req: AuthRequest, res: Response) {
        const result = await db.query('SELECT * FROM queues WHERE user_id = $1 ORDER BY created_at DESC', [req.user?.id]);
        res.json(result.rows);
    }

    // POST /api/queue
    static async createQueue(req: AuthRequest, res: Response) {
        const { name, estimatedWaitTime } = req.body;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const result = await db.query(
            'INSERT INTO queues (user_id, name, code, estimated_wait_time) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user?.id, name, code, estimatedWaitTime || 5]
        );
        res.status(201).json(result.rows[0]);
    }

    // POST /api/queue/join
    static async joinQueue(req: AuthRequest, res: Response) {
        const { queueId, name } = req.body;
        const visitor = await QueueService.joinQueue(queueId, name);
        res.status(201).json(visitor);
    }

    // POST /api/queue/:id/call
    static async callNext(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const visitor = await QueueService.callNext(id, req.user?.id!);
        if (!visitor) return res.status(404).json({ message: 'No waiting visitors' });
        res.json(visitor);
    }

    // POST /api/queue/:id/recall
    static async recall(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const { visitorId } = req.body;
        const visitor = await QueueService.recallVisitor(id, visitorId, req.user?.id!);
        if (!visitor) return res.status(404).json({ message: 'Visitor not found or not served' });
        res.json(visitor);
    }

    // GET /api/queue/:id/metrics
    static async getMetrics(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const metrics = await QueueService.getRealTimeMetrics(id);
        const hourly = await QueueService.getHourlyTraffic(id);
        res.json({ metrics, hourly });
    }
}
