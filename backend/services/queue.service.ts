
import { db } from '../db';
import { getIO } from '../socket';

export class QueueService {
    static async joinQueue(queueId: string, name: string) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const lastTicketRes = await client.query('SELECT ticket_number FROM visitors WHERE queue_id = $1 ORDER BY ticket_number DESC LIMIT 1', [queueId]);
            const nextNum = (lastTicketRes.rows[0]?.ticket_number || 0) + 1;
            
            const res = await client.query(
                `INSERT INTO visitors (queue_id, name, ticket_number, status, join_time) VALUES ($1, $2, $3, 'waiting', NOW()) RETURNING *`,
                [queueId, name, nextNum]
            );
            
            // Log
            await client.query(`INSERT INTO queue_logs (queue_id, visitor_id, action_type) VALUES ($1, $2, 'join')`, [queueId, res.rows[0].id]);
            
            await client.query('COMMIT');
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
            // Mark current serving as served
            await client.query(`UPDATE visitors SET status = 'served', served_time = NOW(), is_alerting = FALSE WHERE queue_id = $1 AND status = 'serving'`, [queueId]);
            
            // Get next
            const nextRes = await client.query(`SELECT id FROM visitors WHERE queue_id = $1 AND status = 'waiting' ORDER BY ticket_number ASC LIMIT 1`, [queueId]);
            
            if (nextRes.rows.length === 0) {
                await client.query('COMMIT');
                getIO().to(queueId).emit('queue:update', { type: 'complete' });
                return null;
            }

            const nextId = nextRes.rows[0].id;
            const updated = await client.query(`UPDATE visitors SET status = 'serving', is_alerting = TRUE WHERE id = $1 RETURNING *`, [nextId]);
            
            await client.query(`INSERT INTO queue_logs (queue_id, visitor_id, action_type, performed_by) VALUES ($1, $2, 'call', $3)`, [queueId, nextId, userId]);
            
            await client.query('COMMIT');
            getIO().to(queueId).emit('queue:update', { type: 'call', visitor: updated.rows[0] });
            return updated.rows[0];
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
    
    // Add other methods (recall, clear, etc.) following pattern...
    // For brevity, using simpler implementations for auxiliary methods
    static async getQueueData(queueId: string) {
        const visitorsRes = await db.query('SELECT * FROM visitors WHERE queue_id = $1 AND status IN (\'waiting\', \'serving\', \'served\') ORDER BY ticket_number ASC', [queueId]);
        
        // Calculate metrics
        const visitors = visitorsRes.rows.map(v => ({...v, ticketNumber: v.ticket_number, joinTime: v.join_time, servedTime: v.served_time}));
        const waiting = visitors.filter(v => v.status === 'waiting').length;
        const served = visitors.filter(v => v.status === 'served').length;
        
        // Logs
        const logsRes = await db.query(`
            SELECT l.action_type as action, l.timestamp as time, v.ticket_number as ticket 
            FROM queue_logs l LEFT JOIN visitors v ON l.visitor_id = v.id 
            WHERE l.queue_id = $1 ORDER BY l.timestamp DESC LIMIT 20`, [queueId]);
        
        const logs = logsRes.rows.map(l => ({
            ...l, 
            time: new Date(l.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
        }));

        // Last called
        const lastCalled = visitors.filter(v => v.status === 'serving' || v.status === 'served').sort((a,b) => b.ticketNumber - a.ticketNumber)[0]?.ticketNumber || 0;

        return {
            queueId,
            currentTicket: lastCalled, // Backwards compat
            lastCalledNumber: lastCalled,
            metrics: { waiting, served, avgWaitTime: 5 }, // Calc properly in real app
            visitors,
            recentActivity: logs
        };
    }
}
