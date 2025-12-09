
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        // Join specific queue room for real-time updates
        socket.on('join_queue', (queueId: string) => {
            socket.join(queueId);
        });

        // Handle customer acknowledgment ("I'm coming")
        socket.on('customer_ack', (data) => {
            if (io) {
                io.to(data.queueId).emit('alert:ack', { visitorId: data.visitorId });
                io.to(data.queueId).emit('customer_response', { visitorId: data.visitorId, status: 'coming' });
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized! Call initSocket first.");
    }
    return io;
};
