
import { db } from '../db';
import { getIO } from '../socket';

export class QueueService {
    static async joinQueue(queueId: string, name: string) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            // Get last ticket number
            const lastTicketRes = await client.query('SELECT ticket_number FROM visitors WHERE queue_id = $1 ORDER BY ticket_number DESC LIMIT 1', [queueId]);
            const nextNum = (lastTicketRes.rows[0]?.ticket_number || 0) + 1;
            
            // Insert Visitor
            const res = await client.query(
                `INSERT INTO visitors (queue_id, name, ticket_number, status, join_time) VALUES ($1, $2, $3, 'waiting', NOW()) RETURNING *`,
                [queueId, name, nextNum]
            );
            
            // Log Action
            await client.query(`INSERT INTO queue_logs (queue_id, visitor_id, action_type) VALUES ($1, $2, 'join')`, [queueId, res.rows[0].id]);
            
            await client.query('COMMIT');
            
            // Emit Event
            getIO().to(queueId).emit('queue:update', { type: 'join' });
            
            return res.rows[0];
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
            
            // 1. Mark currently serving as served
            await client.query(
                `UPDATE visitors SET status = 'served', served_time = NOW(), is_alerting = FALSE WHERE queue_id = $1 AND status = 'serving'`,
                [queueId]
            );
            
            // 2. Find next waiting visitor
            const nextRes = await client.query(
                `SELECT id FROM visitors WHERE queue_id = $1 AND status = 'waiting' ORDER BY ticket_number ASC LIMIT 1`,
                [queueId]
            );
            
            if (nextRes.rows.length === 0) {
                // Queue is empty, just commit the previous update
                await client.query('COMMIT');
                getIO().to(queueId).emit('queue:update', { type: 'complete' });
                return null;
            }

            const nextId = nextRes.rows[0].id;
            
            // 3. Set next visitor to serving
            const updated = await client.query(
                `UPDATE visitors SET status = 'serving', is_alerting = TRUE WHERE id = $1 RETURNING *`,
                [nextId]
            );
            
            // 4. Log
            await client.query(
                `INSERT INTO queue_logs (queue_id, visitor_id, action_type, performed_by) VALUES ($1, $2, 'call', $3)`,
                [queueId, nextId, userId]
            );
            
            await client.query('COMMIT');
            
            // Emit Update
            getIO().to(queueId).emit('queue:update', { type: 'call', visitor: updated.rows[0] });
            
            return updated.rows[0];
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
    
    static async getQueueData(queueId: string) {
        // Fetch active visitors
        const visitorsRes = await db.query(
            `SELECT * FROM visitors WHERE queue_id = $1 AND status IN ('waiting', 'serving', 'served') ORDER BY ticket_number ASC`,
            [queueId]
        );
        
        const visitors = visitorsRes.rows.map(v => ({
            ...v, 
            ticketNumber: v.ticket_number, 
            joinTime: v.join_time, 
            servedTime: v.served_time
        }));
        
        const waiting = visitors.filter(v => v.status === 'waiting').length;
        const served = visitors.filter(v => v.status === 'served').length;
        
        // Fetch recent logs
        const logsRes = await db.query(`
            SELECT l.action_type as action, l.timestamp as time, v.ticket_number as ticket 
            FROM queue_logs l 
            LEFT JOIN visitors v ON l.visitor_id = v.id 
            WHERE l.queue_id = $1 
            ORDER BY l.timestamp DESC LIMIT 20`,
            [queueId]
        );
        
        const logs = logsRes.rows.map(l => ({
            ...l, 
            time: new Date(l.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
        }));

        // Calculate last called number
        const lastCalled = visitors
            .filter(v => v.status === 'serving' || v.status === 'served')
            .sort((a,b) => b.ticketNumber - a.ticketNumber)[0]?.ticketNumber || 0;

        // Fetch queue info for estimated wait time
        const qInfo = await db.query('SELECT estimated_wait_time FROM queues WHERE id = $1', [queueId]);
        const avgWait = qInfo.rows[0]?.estimated_wait_time || 5;

        return {
            queueId,
            currentTicket: lastCalled, 
            lastCalledNumber: lastCalled,
            metrics: { waiting, served, avgWaitTime: avgWait },
            visitors,
            recentActivity: logs
        };
    }
}
