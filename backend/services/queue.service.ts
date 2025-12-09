
import { db } from '../db';
import { getIO } from '../socket';

export class QueueService {
    
    // --- Visitor Operations ---

    static async joinQueue(queueId: string, name: string) {
        // Transaction to ensure ticket numbers don't duplicate
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            // Get last ticket number
            const lastTicketRes = await client.query(
                'SELECT ticket_number FROM visitors WHERE queue_id = $1 ORDER BY ticket_number DESC LIMIT 1',
                [queueId]
            );
            const nextNum = (lastTicketRes.rows[0]?.ticket_number || 0) + 1;

            const insertRes = await client.query(
                `INSERT INTO visitors (queue_id, name, ticket_number, status) 
                 VALUES ($1, $2, $3, 'waiting') RETURNING *`,
                [queueId, name, nextNum]
            );
            
            // Log Action
            await client.query(
                `INSERT INTO queue_logs (queue_id, visitor_id, action_type, metadata) VALUES ($1, $2, 'join', $3)`,
                [queueId, insertRes.rows[0].id, JSON.stringify({ name })]
            );

            await client.query('COMMIT');
            
            // Real-time Update
            const visitor = insertRes.rows[0];
            getIO().to(queueId).emit('queue:update', { type: 'join', visitor });
            
            return visitor;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    static async callNext(queueId: string, userId: string) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 1. Resolve current serving
            await client.query(
                `UPDATE visitors SET status = 'served', served_time = NOW(), is_alerting = FALSE 
                 WHERE queue_id = $1 AND status = 'serving'`,
                [queueId]
            );

            // 2. Find next waiting
            const nextRes = await client.query(
                `SELECT id, ticket_number, name FROM visitors 
                 WHERE queue_id = $1 AND status = 'waiting' 
                 ORDER BY ticket_number ASC LIMIT 1`,
                [queueId]
            );

            if (nextRes.rows.length === 0) {
                await client.query('COMMIT');
                return null;
            }

            const nextVisitor = nextRes.rows[0];

            // 3. Update next to serving
            const updateRes = await client.query(
                `UPDATE visitors SET status = 'serving', is_alerting = TRUE 
                 WHERE id = $1 RETURNING *`,
                [nextVisitor.id]
            );

            // 4. Log
            await client.query(
                `INSERT INTO queue_logs (queue_id, visitor_id, action_type, performed_by) VALUES ($1, $2, 'call', $3)`,
                [queueId, nextVisitor.id, userId]
            );

            await client.query('COMMIT');

            // Real-time Update
            const visitor = updateRes.rows[0];
            getIO().to(queueId).emit('queue:update', { type: 'call', visitor });
            getIO().to(queueId).emit('ticket:called', { ticket: visitor.ticket_number, name: visitor.name });

            return visitor;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    static async recallVisitor(queueId: string, visitorId: string, userId: string) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Set any current serving to served (optional, depending on business logic)
            await client.query(
                `UPDATE visitors SET status = 'served', is_alerting = FALSE WHERE queue_id = $1 AND status = 'serving'`,
                [queueId]
            );

            // Recall target
            const res = await client.query(
                `UPDATE visitors SET status = 'serving', is_alerting = TRUE WHERE id = $1 AND queue_id = $2 RETURNING *`,
                [visitorId, queueId]
            );

            if (res.rows.length > 0) {
                 await client.query(
                    `INSERT INTO queue_logs (queue_id, visitor_id, action_type, performed_by) VALUES ($1, $2, 'recall', $3)`,
                    [queueId, visitorId, userId]
                );
            }

            await client.query('COMMIT');
            
            if (res.rows.length > 0) {
                const visitor = res.rows[0];
                getIO().to(queueId).emit('queue:update', { type: 'recall', visitor });
                return visitor;
            }
            return null;

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    // --- Analytics ---

    static async getRealTimeMetrics(queueId: string) {
        const res = await db.query(
            `SELECT 
                COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
                COUNT(*) FILTER (WHERE status = 'served') as served,
                COALESCE(AVG(EXTRACT(EPOCH FROM (served_time - join_time))/60) FILTER (WHERE status = 'served'), 0) as avg_wait_min
             FROM visitors WHERE queue_id = $1`,
            [queueId]
        );
        return res.rows[0];
    }

    static async getHourlyTraffic(queueId: string) {
        // Group joins by hour (0-23)
        const res = await db.query(
            `SELECT 
                EXTRACT(HOUR FROM join_time) as hour,
                COUNT(*) as count
             FROM visitors 
             WHERE queue_id = $1 AND join_time > NOW() - INTERVAL '24 hours'
             GROUP BY 1 ORDER BY 1`
        );
        return res.rows;
    }
}
