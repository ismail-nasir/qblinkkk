
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer, corsOrigin: string) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: "*", // Allow any origin (IP address or localhost)
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Rooms based on Queue ID
        socket.on('join_queue', (queueId: string) => {
            socket.join(queueId);
            console.log(`Socket ${socket.id} joined queue: ${queueId}`);
        });

        // Customer ack
        socket.on('customer_ack', (data) => {
            if (io) {
                io.to(data.queueId).emit('alert:ack', { visitorId: data.visitorId });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
