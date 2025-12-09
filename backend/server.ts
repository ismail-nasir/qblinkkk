
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './auth';
import { queueRouter } from './controllers';
import { setupWebSockets } from './websocket';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Real-time WebSocket Setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});
setupWebSockets(io);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for logo uploads

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/queue', queueRouter);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!', details: err.message });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Qblink Backend running on port ${PORT}`);
});
