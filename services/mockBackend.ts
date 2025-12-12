
import { User, QueueInfo, QueueData, Visitor, ActivityLog } from '../types';

// Storage Keys
const KEYS = {
  USERS: 'qblink_db_users',
  QUEUES: 'qblink_db_queues',
  VISITORS: 'qblink_db_visitors',
  LOGS: 'qblink_db_logs'
};

// Broadcast Channel for Real-time events
const channel = new BroadcastChannel('qblink_realtime');

// Helper to simulate network delay (Reduced for speed)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockBackendService {
  private users: User[] = [];
  private queues: QueueInfo[] = [];
  private visitors: Visitor[] = [];
  private logs: any[] = [];

  constructor() {
    this.load();
    // Listen for cross-tab updates to sync state if needed, though LocalStorage is shared
    channel.onmessage = (event) => {
       if (event.data.type === 'SYNC_DB') {
           this.load();
       }
    };
  }

  private load() {
    try {
      this.users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      this.queues = JSON.parse(localStorage.getItem(KEYS.QUEUES) || '[]');
      this.visitors = JSON.parse(localStorage.getItem(KEYS.VISITORS) || '[]');
      this.logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
    } catch (e) {
      console.error("Failed to load mock DB", e);
    }
  }

  private save() {
    localStorage.setItem(KEYS.USERS, JSON.stringify(this.users));
    localStorage.setItem(KEYS.QUEUES, JSON.stringify(this.queues));
    localStorage.setItem(KEYS.VISITORS, JSON.stringify(this.visitors));
    localStorage.setItem(KEYS.LOGS, JSON.stringify(this.logs));
  }

  private emit(event: string, queueId?: string, payload?: any) {
    // 1. Send to other tabs
    channel.postMessage({ type: 'SOCKET_EVENT', event, queueId, payload });
    // 2. Dispatch locally for the current tab
    window.dispatchEvent(new CustomEvent('qblink_socket_event', { detail: { event, queueId, payload } }));
  }

  // Helper to generate queue data object
  private _getQueueData(queueId: string): QueueData {
      const qVisitors = this.visitors.filter(v => v.id.startsWith(queueId + '_') || (v as any).queueId === queueId).map(v => ({
          ...v,
          queueId: queueId 
      }));
      
      const relevantVisitors = this.visitors.filter(v => (v as any).queueId === queueId);
      
      const waiting = relevantVisitors.filter(v => v.status === 'waiting').length;
      const served = relevantVisitors.filter(v => v.status === 'served').length;
      
      // Rating Calc
      const rated = relevantVisitors.filter(v => v.rating && v.rating > 0);
      const avgRating = rated.length > 0 ? rated.reduce((a,b) => a + (b.rating||0), 0) / rated.length : 0;

      const lastCalled = relevantVisitors
          .filter(v => v.status === 'serving' || v.status === 'served')
          .sort((a,b) => b.ticketNumber - a.ticketNumber)[0]?.ticketNumber || 0;
          
      const queueInfo = this.queues.find(q => q.id === queueId);
      const avgWait = queueInfo?.estimatedWaitTime || 5;

      const qLogs = this.logs
          .filter(l => l.queueId === queueId)
          .sort((a,b) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime())
          .slice(0, 50);

      return {
          queueId,
          currentTicket: lastCalled,
          lastCalledNumber: lastCalled,
          metrics: { waiting, served, avgWaitTime: avgWait, averageRating: Number(avgRating.toFixed(1)) },
          visitors: relevantVisitors.sort((a,b) => {
              if (a.isPriority && !b.isPriority) return -1;
              if (!a.isPriority && b.isPriority) return 1;
              if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
              return a.ticketNumber - b.ticketNumber;
          }),
          recentActivity: qLogs
      };
  }

  // --- HANDLERS ---

  async handleRequest(method: string, endpoint: string, body?: any, user?: User): Promise<any> {
    await delay(50); // Minimal latency for "feeling" of async but fast

    this.load(); // Refresh state from storage

    // --- AUTH ---
    if (endpoint === '/auth/signup') {
      const { email, password, businessName } = body;
      if (this.users.find(u => u.email === email)) throw new Error("Email already exists");
      
      const role = email === 'ismailnsm75@gmail.com' ? 'superadmin' : 'owner';

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        businessName,
        role: role,
        isVerified: true, // Auto verify for demo
        joinedAt: new Date().toISOString()
      };
      this.users.push(newUser);
      this.save();
      return { user: newUser, token: 'mock_token_' + newUser.id };
    }

    if (endpoint === '/auth/login') {
      const { email } = body;
      const user = this.users.find(u => u.email === email);
      if (!user) throw new Error("Invalid credentials");

      // FIX: Ensure correct role for specific email even if already created
      if (user.email === 'ismailnsm75@gmail.com' && user.role !== 'superadmin') {
          user.role = 'superadmin';
          this.save();
      }

      return { user, token: 'mock_token_' + user.id };
    }

    if (endpoint === '/auth/verify') {
        const { email } = body;
        const user = this.users.find(u => u.email === email);
        if (user) {
            user.isVerified = true;
            this.save();
            return { user, token: 'mock_token_' + user.id };
        }
        throw new Error("User not found");
    }

    // --- QUEUES ---
    if (endpoint === '/queue' && method === 'GET') {
      return this.queues.filter(q => q.userId === user?.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (endpoint === '/queue' && method === 'POST') {
      const { name, estimatedWaitTime, businessType, features, location } = body;
      const newQueue: QueueInfo = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user!.id,
        name,
        location,
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        estimatedWaitTime: estimatedWaitTime || 5,
        settings: { 
            soundEnabled: true, 
            soundVolume: 1, 
            soundType: 'beep', 
            themeColor: '#3b82f6', 
            gracePeriodMinutes: 2 
        },
        isPaused: false,
        announcement: '',
        businessType: businessType || 'general',
        features: features || { vip: true, multiCounter: true, anonymousMode: false, sms: false }
      };
      this.queues.push(newQueue);
      this.save();
      return newQueue;
    }

    if (endpoint.match(/\/queue\/.*\/info/)) {
        const queueId = endpoint.split('/')[2];
        const queue = this.queues.find(q => q.id === queueId);
        if (!queue) throw new Error("Queue not found");
        return queue;
    }

    if (endpoint.match(/\/queue\/.*\/data/)) {
        const queueId = endpoint.split('/')[2];
        return this._getQueueData(queueId);
    }

    // --- ACTIONS ---
    if (endpoint === '/queue/join') {
        const { queueId, name, phoneNumber, source } = body;
        
        const queue = this.queues.find(q => q.id === queueId);
        if (!queue) throw new Error("Queue not found");
        if (queue.isPaused) throw new Error("Queue is currently paused");

        // Duplicate Check
        if (phoneNumber) {
            const existing = this.visitors.find(v => 
                (v as any).queueId === queueId && 
                v.phoneNumber === phoneNumber && 
                (v.status === 'waiting' || v.status === 'serving')
            );
            if (existing) throw new Error("You are already in this queue.");
        }

        const qVisitors = this.visitors.filter(v => (v as any).queueId === queueId);
        const maxTicket = qVisitors.reduce((max, v) => Math.max(max, v.ticketNumber), 0);
        
        const newVisitor: Visitor & { queueId: string } = {
            id: Math.random().toString(36).substr(2, 9),
            ticketNumber: maxTicket + 1,
            name: name || `Guest ${maxTicket + 1}`,
            phoneNumber: phoneNumber || '',
            joinTime: new Date().toISOString(),
            status: 'waiting',
            queueId,
            source: source || 'qr',
            isPriority: false,
            order: maxTicket + 1
        };
        
        this.visitors.push(newVisitor);
        this.log(queueId, newVisitor.ticketNumber, 'join');
        this.save();
        this.emit('queue:update', queueId);
        
        // Return Updated Queue Data immediately
        return { visitor: newVisitor, queueData: this._getQueueData(queueId) };
    }

    if (endpoint.endsWith('/call')) {
        const queueId = endpoint.split('/')[2];
        const { servedBy } = body;
        
        // Mark current serving as served
        const serving = this.visitors.find(v => (v as any).queueId === queueId && v.status === 'serving' && (!servedBy || !v.servedBy || v.servedBy === servedBy));
        if (serving) {
            serving.status = 'served';
            serving.servedTime = new Date().toISOString();
            serving.isAlerting = false;
        }

        // Find next waiting
        const next = this.visitors
            .filter(v => (v as any).queueId === queueId && v.status === 'waiting')
            .sort((a,b) => {
                if (a.isPriority && !b.isPriority) return -1;
                if (!a.isPriority && b.isPriority) return 1;
                if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                return a.ticketNumber - b.ticketNumber;
            })[0];

        if (next) {
            next.status = 'serving';
            next.isAlerting = true;
            next.servedBy = servedBy || 'Staff';
            next.servingStartTime = new Date().toISOString();
            this.log(queueId, next.ticketNumber, 'call', servedBy);
        }

        this.save();
        this.emit('queue:update', queueId, { type: 'call', visitor: next });
        return next || {};
    }

    if (endpoint.endsWith('/reorder')) {
        const queueId = endpoint.split('/')[2];
        const { visitors: reorderedVisitors } = body;
        
        // Remove existing visitors for this queue that are waiting
        this.visitors = this.visitors.filter(v => !((v as any).queueId === queueId && v.status === 'waiting'));
        
        // Add them back with updated order fields
        const newVisitorsWithId = reorderedVisitors.map((v: Visitor, index: number) => ({
            ...v,
            queueId,
            order: index + 1
        }));
        
        this.visitors.push(...newVisitorsWithId);
        
        this.save();
        this.emit('queue:update', queueId);
        return { success: true };
    }

    if (endpoint.endsWith('/alert')) {
        const queueId = endpoint.split('/')[2];
        const { visitorId, type } = body;
        const visitor = this.visitors.find(v => v.id === visitorId);
        if (visitor) {
            visitor.isAlerting = type === 'trigger';
            this.save();
            this.emit('queue:update', queueId);
        }
        return { success: true };
    }
    
    if (endpoint.endsWith('/priority')) {
        const queueId = endpoint.split('/')[2];
        const { visitorId, isPriority } = body;
        const visitor = this.visitors.find(v => v.id === visitorId);
        if (visitor) {
            visitor.isPriority = isPriority;
            this.save();
            this.emit('queue:update', queueId);
        }
        return { success: true };
    }

    if (endpoint.endsWith('/leave')) {
        const queueId = endpoint.split('/')[2];
        const { visitorId } = body;
        const visitor = this.visitors.find(v => v.id === visitorId);
        if (visitor) {
            visitor.status = 'cancelled';
            this.log(queueId, visitor.ticketNumber, 'leave');
            this.save();
            this.emit('queue:update', queueId);
        }
        return { success: true };
    }
    
    if (endpoint.endsWith('/feedback')) {
        const queueId = endpoint.split('/')[2];
        const { visitorId, rating, feedback } = body;
        const visitor = this.visitors.find(v => v.id === visitorId);
        if (visitor) {
            visitor.rating = rating;
            visitor.feedback = feedback;
            this.save();
            this.emit('queue:update', queueId);
        }
        return { success: true };
    }
    
    if (endpoint.endsWith('/clear')) {
        const queueId = endpoint.split('/')[2];
        this.visitors.forEach(v => {
            if((v as any).queueId === queueId && v.status === 'waiting') {
                v.status = 'cancelled';
            }
        });
        this.save();
        this.emit('queue:update', queueId);
        return { success: true };
    }
    
    // Call by number
    if (endpoint.endsWith('/call-number')) {
         const queueId = endpoint.split('/')[2];
         const { ticketNumber, servedBy } = body;
         
         // 1. Mark current serving as served
         const serving = this.visitors.find(v => (v as any).queueId === queueId && v.status === 'serving' && (!servedBy || !v.servedBy || v.servedBy === servedBy));
         if (serving) {
             serving.status = 'served';
             serving.servedTime = new Date().toISOString();
             serving.isAlerting = false;
         }
         
         // 2. Find target
         const target = this.visitors.find(v => (v as any).queueId === queueId && v.ticketNumber === ticketNumber);
         if (target) {
             target.status = 'serving';
             target.isAlerting = true;
             target.servedBy = servedBy || 'Staff';
             target.servingStartTime = new Date().toISOString();
             this.log(queueId, target.ticketNumber, 'call', servedBy);
         }
         
         this.save();
         this.emit('queue:update', queueId);
         return { success: true };
    }

    if (endpoint.endsWith('/recall')) {
         const queueId = endpoint.split('/')[2];
         const { visitorId, servedBy } = body;
         
         const serving = this.visitors.find(v => (v as any).queueId === queueId && v.status === 'serving' && (!servedBy || !v.servedBy || v.servedBy === servedBy));
         if (serving) {
             serving.status = 'served';
             serving.servedTime = new Date().toISOString();
             serving.isAlerting = false;
         }
         
         const target = this.visitors.find(v => v.id === visitorId);
         if (target) {
             target.status = 'serving';
             target.isAlerting = true;
             target.servedBy = servedBy || 'Staff';
         }
         
         this.save();
         this.emit('queue:update', queueId);
         return { success: true };
    }
    
    if (endpoint.endsWith('/take-back')) {
         const queueId = endpoint.split('/')[2];
         const { servedBy } = body;
         
         const serving = this.visitors.find(v => (v as any).queueId === queueId && v.status === 'serving' && (!servedBy || !v.servedBy || v.servedBy === servedBy));
         if (serving) {
             serving.status = 'waiting';
             serving.isAlerting = false;
             serving.servedBy = undefined;
             this.save();
             this.emit('queue:update', queueId);
         }
         return { success: true };
    }

    if (method === 'PUT' && endpoint.startsWith('/queue/')) {
        const queueId = endpoint.split('/')[2];
        const queue = this.queues.find(q => q.id === queueId);
        if (queue) {
            Object.assign(queue, body);
            this.save();
            this.emit('queue:update', queueId);
            return queue;
        }
    }

    if (method === 'DELETE' && endpoint.startsWith('/queue/')) {
         const queueId = endpoint.split('/')[2];
         this.queues = this.queues.filter(q => q.id !== queueId);
         this.save();
         return { success: true };
    }

    if (endpoint === '/admin/system-logs') {
        return this.logs.slice(0, 50);
    }
    
    // --- ADMIN MOCK ---
    if (endpoint === '/admin/users') {
        return this.users.map(u => ({ id: u.id, email: u.email, businessName: u.businessName, role: u.role, isVerified: u.isVerified, joinedAt: u.joinedAt }));
    }
    
    if (endpoint === '/admin/list') {
        return this.users.filter(u => u.role === 'admin' || u.role === 'superadmin').map(u => u.email);
    }
    
    if (endpoint === '/admin/add') {
        const { email } = body;
        const u = this.users.find(u => u.email === email);
        if (u) { u.role = 'admin'; this.save(); }
        return { success: true };
    }
    
    if (endpoint === '/admin/remove') {
        const { email } = body;
        const u = this.users.find(u => u.email === email);
        if (u && u.role !== 'superadmin') { u.role = 'owner'; this.save(); }
        return { success: true };
    }
    
    if (endpoint === '/admin/logs') {
        // Mock audit logs
        return [{ id: '1', adminEmail: 'ismailnsm75@gmail.com', action: 'System Init', timestamp: new Date().toISOString() }];
    }
    
    console.warn("Mock endpoint not found:", method, endpoint);
    return {};
  }

  private log(queueId: string, ticket: number, action: string, user?: string) {
      this.logs.unshift({
          queueId,
          ticket,
          action,
          time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
          rawTime: new Date().toISOString(),
          user: user || 'System', 
          email: 'system@qblink.com' 
      });
  }
}

export const mockBackend = new MockBackendService();
