
import { io, Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from './config';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_BASE_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to WebSocket Server:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('WebSocket Connection Error:', err);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('WebSocket Disconnected:', reason);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinQueue(queueId: string) {
    if (!this.socket) this.connect();
    this.socket?.emit('join_queue', queueId);
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  emit(event: string, data: any) {
    if (!this.socket) this.connect();
    this.socket?.emit(event, data);
  }
}

export const socketService = new SocketService();
