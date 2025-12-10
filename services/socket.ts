
import { firebaseService } from './firebase';

class SocketService {
  // Legacy fallback
  private channel: BroadcastChannel;
  private listeners: Map<string, Function[]> = new Map();
  private joinedRooms: Set<string> = new Set();
  
  // Firebase unsubscribe handles
  private firebaseUnsubscribes: Record<string, Function[]> = {};

  constructor() {
    this.channel = new BroadcastChannel('qblink_realtime');
    
    // Fallback: Listen for messages from other tabs (Local Simulation)
    this.channel.onmessage = (event) => {
      this.handleEvent(event.data);
    };

    // Fallback: Listen for messages from the MockBackend in the SAME tab
    window.addEventListener('qblink_socket_event', (e: any) => {
      this.handleEvent(e.detail);
    });
  }

  private handleEvent(data: any) {
    // Only process simulated events if Firebase is NOT active, or if explicitly simulated
    if (!firebaseService.isAvailable) {
        if (data.type === 'SOCKET_EVENT' || data.event) {
           if (this.joinedRooms.has(data.queueId) || !data.queueId) {
               this.trigger(data.event, data.payload);
           }
        }
    }
  }

  connect() {
    console.log(firebaseService.isAvailable ? '✅ Connected to Firebase Realtime Stream' : '⚠️ Connected to Local Simulation');
  }

  disconnect() {
    // Clean up Firebase listeners
    Object.values(this.firebaseUnsubscribes).forEach(unsubs => unsubs.forEach(u => u()));
    this.firebaseUnsubscribes = {};
  }

  joinQueue(queueId: string) {
    // 1. Setup Firebase Listener
    if (firebaseService.isAvailable) {
        // If already listening, don't duplicate
        if (this.firebaseUnsubscribes[queueId]) return;

        console.log(`📡 Syncing Queue: ${queueId}`);

        // Listen for ANY change in visitors for this queue
        const visitorsRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
        const unsubVisitors = firebaseService.onValue(visitorsRef, (snapshot) => {
            // Determine if this is an ALERT acknowledgement
            // (In a full implementation, we'd diff the snapshot, but simply triggering update works for React)
            this.trigger('queue:update', { source: 'firebase' });
            
            // Check for customer ack specifically (isAlerting went false or status change?)
            // For simple "I'm coming", the frontend usually polls or reacts to data change.
            // If we need specific events:
            if (snapshot.exists()) {
                 const vals = snapshot.val();
                 // Logic to detect specific events could go here if bandwidth allows
            }
        });

        // Listen for Queue Settings changes
        const queueRef = firebaseService.ref(firebaseService.db, `queues/${queueId}`);
        const unsubQueue = firebaseService.onValue(queueRef, () => {
             this.trigger('queue:update', { source: 'firebase' });
        });

        this.firebaseUnsubscribes[queueId] = [unsubVisitors, unsubQueue];
    } else {
        // 2. Fallback to Local Simulation
        this.joinedRooms.add(queueId);
    }
  }

  emit(event: string, data: any) {
    if (firebaseService.isAvailable) {
        // For writes, we usually go through the Service/API methods (create/update/delete).
        // However, for ephemeral "I'm coming" acknowledgements that might not need DB persistence
        // but typically DO in this architecture (updating isAlerting=false),
        // we handle them via queueService updates which then trigger onValue listeners.
        // So explicit emits are rare in Firebase-only mode unless using Cloud Functions.
        
        // If we strictly need to emit a transient event:
        // We could push to a 'events/{queueId}' list.
    } else {
        // Fallback Logic
        if (event === 'customer_ack') {
            const payload = { 
                type: 'SOCKET_EVENT', 
                event: 'alert:ack', 
                queueId: data.queueId, 
                payload: { visitorId: data.visitorId } 
            };
            this.channel.postMessage(payload);
            this.handleEvent(payload);
        }
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
