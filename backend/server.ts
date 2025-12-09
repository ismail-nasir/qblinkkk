import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { queueRouter } from './routes/queue.routes';
import { adminRouter } from './routes/admin.routes';
import { initSocket } from './socket';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize WebSocket Server
initSocket(server);

// Global Middleware
app.use(helmet()); // Security Headers
app.use(cors({ origin: '*' })); // Allow all origins (Mobile/Web/Local)
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/queue', queueRouter);
app.use('/api/admin', adminRouter);

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Qblink Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
