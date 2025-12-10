
// A Socket.IO simulation using BroadcastChannel for Serverless/Local environments
// This allows the "Online" features (multi-tab sync, alerts) to work without a Node server.

class SocketService {
  private channel: BroadcastChannel;
  private listeners: Map<string, Function[]> = new Map();
  private joinedRooms: Set<string> = new Set();

  constructor() {
    this.channel = new BroadcastChannel('qblink_realtime');
    
    // Listen for messages from other tabs
    this.channel.onmessage = (event) => {
      this.handleEvent(event.data);
    };

    // Listen for messages from the MockBackend in the SAME tab
    window.addEventListener('qblink_socket_event', (e: any) => {
      this.handleEvent(e.detail);
    });
  }

  private handleEvent(data: any) {
    if (data.type === 'SOCKET_EVENT' || data.event) {
       // If this socket has joined the room (queueId) or it's a global event
       if (this.joinedRooms.has(data.queueId) || !data.queueId) {
           this.trigger(data.event, data.payload);
       }
    }
  }

  connect() {
    console.log('✅ Connected to Simulated Socket (BroadcastChannel)');
  }

  disconnect() {
    // No-op for simulation
  }

  joinQueue(queueId: string) {
    this.joinedRooms.add(queueId);
    console.log(`Joined room: ${queueId}`);
  }

  // Simulate emitting to server (which would then broadcast)
  emit(event: string, data: any) {
    // For "customer_ack", we loop it back immediately as if server processed it
    if (event === 'customer_ack') {
        const payload = { 
            type: 'SOCKET_EVENT', 
            event: 'alert:ack', 
            queueId: data.queueId, 
            payload: { visitorId: data.visitorId } 
        };
        
        // Broadcast to other tabs
        this.channel.postMessage(payload);
        // Trigger locally
        this.handleEvent(payload);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string) {
    this.listeners.delete(event);
  }

  private trigger(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

export const socketService = new SocketService();
