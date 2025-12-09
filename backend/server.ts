
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './auth';
import { queueRouter } from './routes/queue.routes';
import { initSocket } from './socket';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize WebSocket Singleton
initSocket(server, process.env.FRONTEND_URL || "*");

// Global Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/queue', queueRouter);

// Global Error Handler (Fallback)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Qblink Production Backend running on port ${PORT}`);
    console.log(`📡 WebSocket Server ready`);
});
