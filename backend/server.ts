
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './auth';
import { queueRouter } from './routes/queue.routes';
import { adminRouter } from './routes/admin.routes';
import { initSocket } from './socket';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize WebSocket Singleton
// Allow * origin for socket.io as well
initSocket(server, "*");

// Global Middleware
app.use(helmet());

// CRITICAL FIX: Allow all origins (CORS) so mobile devices accessing via IP (e.g. 192.168.1.5) can connect
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/queue', queueRouter);
app.use('/api/admin', adminRouter);

// Global Error Handler (Fallback)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => { // Listen on 0.0.0.0 to accept external connections
    console.log(`🚀 Qblink Production Backend running on port ${PORT}`);
    console.log(`📡 WebSocket Server ready`);
});
