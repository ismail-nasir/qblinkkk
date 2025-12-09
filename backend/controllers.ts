
import { Router } from 'express';
import { authenticate } from './middleware';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const queueRouter = Router();

// --- Queue Management ---

// Get all queues for a user
queueRouter.get('/', authenticate, async (req: any, res) => {
    const result = await pool.query('SELECT * FROM queues WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
});

// Create Queue
queueRouter.post('/', authenticate, async (req: any, res) => {
    const { name, estimatedWaitTime } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // Simple gen
    
    const result = await pool.query(
        'INSERT INTO queues (user_id, name, code, estimated_wait_time) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.user.id, name, code, estimatedWaitTime || 5]
    );
    res.json(result.rows[0]);
});

// --- Visitor/Ticket Management ---

// Join Queue (Public Endpoint)
queueRouter.post('/join', async (req, res) => {
    const { queueId, name } = req.body;
    
    // Get last ticket number
    const lastTicket = await pool.query(
        'SELECT ticket_number FROM visitors WHERE queue_id = $1 ORDER BY ticket_number DESC LIMIT 1',
        [queueId]
    );
    const nextNum = (lastTicket.rows[0]?.ticket_number || 0) + 1;

    const result = await pool.query(
        'INSERT INTO visitors (queue_id, name, ticket_number, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [queueId, name, nextNum, 'waiting']
    );

    // Emit socket event (pseudo-code)
    // io.to(queueId).emit('update', { type: 'join', visitor: result.rows[0] });

    res.json(result.rows[0]);
});

// Call Next (Protected)
queueRouter.post('/:id/call-next', authenticate, async (req, res) => {
    const { id } = req.params;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Mark current serving as served
        await client.query(
            "UPDATE visitors SET status = 'served', served_time = NOW(), is_alerting = FALSE WHERE queue_id = $1 AND status = 'serving'",
            [id]
        );

        // 2. Get next waiting
        const next = await client.query(
            "SELECT id FROM visitors WHERE queue_id = $1 AND status = 'waiting' ORDER BY ticket_number ASC LIMIT 1",
            [id]
        );

        if (next.rows.length === 0) {
            await client.query('COMMIT');
            return res.json({ message: 'Queue empty' });
        }

        // 3. Set next to serving
        const updated = await client.query(
            "UPDATE visitors SET status = 'serving', is_alerting = TRUE WHERE id = $1 RETURNING *",
            [next.rows[0].id]
        );

        await client.query('COMMIT');
        res.json(updated.rows[0]);
    } catch (e: any) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});
