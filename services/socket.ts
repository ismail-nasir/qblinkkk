
// VIRTUAL SOCKET SERVICE (Using BroadcastChannel for Cross-Tab Comms)

type Listener = (data: any) => void;

class VirtualSocket {
  private channel: BroadcastChannel;
  private listeners: Map<string, Listener[]> = new Map();

  constructor() {
    this.channel = new BroadcastChannel('qblink_realtime');
    
    this.channel.onmessage = (event) => {
      const { type, data } = event.data;
      this.notify(type, data);
    };

    // Listen to local storage events as a backup/trigger
    window.addEventListener('storage', () => {
       // When storage changes (e.g. data updated in api.ts), trigger generic update
       this.notify('queue:update', {});
    });
  }

  connect() {
    // No-op for virtual socket
    console.log('⚡ Virtual Socket Connected');
  }

  disconnect() {
    // No-op
  }

  joinQueue(queueId: string) {
    // In a real socket we'd emit 'join', here we just logically know we care about this queue
  }

  on(event: string, callback: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string) {
    this.listeners.delete(event);
  }

  // Emit event to OTHER tabs
  emit(event: string, data?: any) {
    // 1. Send to other tabs
    this.channel.postMessage({ type: event, data });
    // 2. Trigger locally immediately (so the sender updates too)
    this.notify(event, data);
  }

  private notify(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

export const socketService = new VirtualSocket();
