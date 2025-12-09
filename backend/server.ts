
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './auth';
import { queueRouter } from './routes/queue.routes';
import { adminRouter } from './routes/admin.routes';
import { initSocket } from './socket';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize WebSocket with permissive CORS for connectivity
initSocket(server, "*");

// Security Middleware
app.use(helmet());

// CORS Configuration: Allow All Origins (for easiest deployment/mobile access)
// In strict production, replace '*' with specific domain list
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsing (Increased limit for logo uploads)
app.use(express.json({ limit: '10mb' }));

// Request Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/queue', queueRouter);
app.use('/api/admin', adminRouter);

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => { 
    console.log(`🚀 Qblink Backend running on port ${PORT}`);
    console.log(`📡 WebSocket Server ready`);
});
