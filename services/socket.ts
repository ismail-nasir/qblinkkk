
import { io, Socket } from 'socket.io-client';
import { authService } from './auth';

const getSocketUrl = () => {
    const stored = localStorage.getItem('qblink_socket_url');
    // Default to port 3000 to match backend/server.ts
    return stored || 'http://localhost:3000';
};

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    const token = authService.getToken();
    const url = getSocketUrl();

    this.socket = io(url, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a specific queue channel/room
  joinQueue(queueId: string) {
    if (!this.socket) this.connect();
    this.socket?.emit('join_queue', queueId);
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) this.connect();
    this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  emit(event: string, data?: any) {
    if (!this.socket) this.connect();
    this.socket?.emit(event, data);
  }
}

export const socketService = new SocketService();
