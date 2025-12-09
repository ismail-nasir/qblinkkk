
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
app.use(helmet()); 
app.use(cors({ origin: '*' })); // Allow all origins for simplicity in this specific project scope
app.use(express.json({ limit: '10mb' })); 

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/queue', queueRouter);
app.use('/api/admin', adminRouter);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
