import { io, Socket } from 'socket.io-client';
import { authService } from './auth';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    const token = authService.getToken();

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
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