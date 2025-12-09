
import { Server } from 'socket.io';

export const setupWebSockets = (io: Server) => {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join a specific queue room
        socket.on('join_queue_room', (queueId) => {
            socket.join(queueId);
            console.log(`Socket ${socket.id} joined room ${queueId}`);
        });

        // Handle customer "I'm coming" acknowledgment
        socket.on('customer_ack', (data) => {
            // Broadcast to the business dashboard that customer is coming
            io.to(data.queueId).emit('customer_response', { 
                visitorId: data.visitorId, 
                status: 'coming' 
            });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
    
    // Helper to emit events from controllers
    // In a real app, you'd export a singleton or pass IO to context
};
