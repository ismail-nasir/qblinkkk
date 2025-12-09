
import { User, QueueInfo, QueueData, Visitor, QueueSettings } from '../types';

// VIRTUAL CLOUD DATABASE (LocalStorage Wrapper)
const DB = {
  get: (key: string) => {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch { return null; }
  },
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger storage event for cross-tab sync
    window.dispatchEvent(new Event('storage'));
  },
  update: (key: string, updater: (prev: any) => any) => {
    const prev = DB.get(key) || [];
    const next = updater(prev);
    DB.set(key, next);
    return next;
  }
};

// INITIAL DATA SEEDING
const seedData = () => {
  if (!DB.get('users')) DB.set('users', []);
  if (!DB.get('queues')) DB.set('queues', []);
  if (!DB.get('visitors')) DB.set('visitors', []);
  if (!DB.get('logs')) DB.set('logs', []);
};
seedData();

// MOCK API ROUTER
class MockApi {
  
  private async delay() {
    // Simulate network latency for realism (optional, keep short for snappy feel)
    return new Promise(resolve => setTimeout(resolve, 200)); 
  }

  async post(endpoint: string, body: any): Promise<any> {
    await this.delay();
    
    // --- AUTH ---
    if (endpoint === '/auth/login') {
      const users = DB.get('users') || [];
      const user = users.find((u: User) => u.email === body.email);
      if (!user) throw new Error("User not found");
      // In a real app we'd check password hash. Here we trust for demo.
      return { user, token: 'mock-jwt-token' };
    }

    if (endpoint === '/auth/signup') {
      const users = DB.get('users') || [];
      if (users.find((u: User) => u.email === body.email)) throw new Error("Email already exists");
      
      const newUser: User = {
        id: crypto.randomUUID(),
        email: body.email,
        businessName: body.businessName,
        joinedAt: new Date().toISOString(),
        isVerified: true, // Auto verify for demo
        role: body.email === 'ismailnsm75@gmail.com' ? 'superadmin' : 'owner'
      };
      
      DB.set('users', [...users, newUser]);
      return { user: newUser, token: 'mock-jwt-token' };
    }

    if (endpoint === '/auth/logout') return { message: "Logged out" };

    // --- QUEUES ---
    if (endpoint === '/queue') {
       const user = this.getCurrentUser();
       const newQueue: QueueInfo = {
           id: crypto.randomUUID(),
           userId: user.id,
           name: body.name,
           code: Math.random().toString(36).substring(2, 8).toUpperCase(),
           status: 'active',
           createdAt: new Date().toISOString(),
           estimatedWaitTime: body.estimatedWaitTime || 5,
           settings: { soundEnabled: true, soundVolume: 1.0, soundType: 'beep' }
       };
       DB.update('queues', (prev: any[]) => [...prev, newQueue]);
       return newQueue;
    }

    if (endpoint === '/queue/join') {
        const { queueId, name } = body;
        const allVisitors = DB.get('visitors') || [];
        
        // Calculate Ticket Number
        const queueVisitors = allVisitors.filter((v: any) => v.queueId === queueId);
        const lastTicket = queueVisitors.length > 0 ? Math.max(...queueVisitors.map((v: any) => v.ticketNumber)) : 0;
        
        const newVisitor: Visitor & { queueId: string } = {
            id: crypto.randomUUID(),
            queueId,
            name,
            ticketNumber: lastTicket + 1,
            joinTime: new Date().toISOString(),
            status: 'waiting'
        };
        
        DB.set('visitors', [...allVisitors, newVisitor]);
        
        // Log
        this.logAction(queueId, newVisitor.id, 'join', `Visitor ${name} joined`);
        
        return { visitor: newVisitor };
    }

    // --- QUEUE ACTIONS ---
    if (endpoint.includes('/call')) {
        const queueId = endpoint.split('/')[2];
        const visitors = DB.get('visitors') || [];
        
        // 1. Mark current serving as served
        const updatedVisitors = visitors.map((v: any) => {
            if (v.queueId === queueId && v.status === 'serving') {
                return { ...v, status: 'served', servedTime: new Date().toISOString(), isAlerting: false };
            }
            return v;
        });

        // 2. Find next waiting
        const nextVisitorIndex = updatedVisitors.findIndex((v: any) => v.queueId === queueId && v.status === 'waiting');
        
        if (nextVisitorIndex !== -1) {
            updatedVisitors[nextVisitorIndex].status = 'serving';
            updatedVisitors[nextVisitorIndex].isAlerting = true;
            this.logAction(queueId, updatedVisitors[nextVisitorIndex].id, 'call', 'Called next visitor');
        }

        DB.set('visitors', updatedVisitors);
        return { message: "Called next" };
    }

    if (endpoint.includes('/alert')) {
        const queueId = endpoint.split('/')[2];
        const { visitorId, type } = body;
        
        DB.update('visitors', (prev: any[]) => prev.map((v: any) => {
            if (v.id === visitorId) {
                return { ...v, isAlerting: type === 'trigger' };
            }
            return v;
        }));
        return { success: true };
    }
    
    if (endpoint.includes('/recall')) {
        const queueId = endpoint.split('/')[2];
        const { visitorId } = body;
        
        DB.update('visitors', (prev: any[]) => prev.map((v: any) => {
            if (v.queueId === queueId && v.status === 'serving') {
                 // Dismiss current serving
                 return { ...v, status: 'served', isAlerting: false };
            }
            if (v.id === visitorId) {
                return { ...v, status: 'serving', isAlerting: true };
            }
            return v;
        }));
        return { success: true };
    }

    if (endpoint.includes('/clear')) {
        const queueId = endpoint.split('/')[2];
        DB.update('visitors', (prev: any[]) => prev.map((v: any) => {
            if (v.queueId === queueId && v.status === 'waiting') {
                return { ...v, status: 'cancelled' };
            }
            return v;
        }));
        return { success: true };
    }
    
    if (endpoint.includes('/take-back')) {
        const queueId = endpoint.split('/')[2];
        DB.update('visitors', (prev: any[]) => prev.map((v: any) => {
             if (v.queueId === queueId && v.status === 'serving') {
                 return { ...v, status: 'waiting', isAlerting: false };
             }
             return v;
        }));
        return { success: true };
    }
    
    if (endpoint.includes('/leave')) {
        const queueId = endpoint.split('/')[2];
        const { visitorId } = body;
        DB.update('visitors', (prev: any[]) => prev.map((v: any) => {
             if (v.id === visitorId) {
                 return { ...v, status: 'cancelled' };
             }
             return v;
        }));
        return { success: true };
    }
    
    if (endpoint.includes('/reorder')) {
        const queueId = endpoint.split('/')[2];
        const { visitors } = body; // The new ordered list
        
        // We need to merge this new order into the main DB
        const allVisitors = DB.get('visitors') || [];
        const otherQueuesVisitors = allVisitors.filter((v: any) => v.queueId !== queueId);
        
        // Ensure the reordered visitors have the correct queueId
        const updatedQueueVisitors = visitors.map((v: any) => ({ ...v, queueId }));
        
        DB.set('visitors', [...otherQueuesVisitors, ...updatedQueueVisitors]);
        return { success: true };
    }

    return null;
  }

  async get(endpoint: string): Promise<any> {
    await this.delay();

    if (endpoint === '/queue') {
        const user = this.getCurrentUser();
        const queues = DB.get('queues') || [];
        return queues.filter((q: QueueInfo) => q.userId === user?.id);
    }
    
    if (endpoint.includes('/info')) {
        const queueId = endpoint.split('/')[2];
        const queues = DB.get('queues') || [];
        return queues.find((q: QueueInfo) => q.id === queueId);
    }

    if (endpoint.includes('/data')) {
        const queueId = endpoint.split('/')[2];
        const allVisitors = DB.get('visitors') || [];
        const queueVisitors = allVisitors.filter((v: any) => v.queueId === queueId);
        
        // Calculate Metrics
        const waiting = queueVisitors.filter((v: any) => v.status === 'waiting').length;
        const served = queueVisitors.filter((v: any) => v.status === 'served').length;
        const current = queueVisitors.find((v: any) => v.status === 'serving');
        
        // Get Logs
        const allLogs = DB.get('logs') || [];
        const recentActivity = allLogs
            .filter((l: any) => l.queueId === queueId)
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return {
            queueId,
            currentTicket: current ? current.ticketNumber : 0,
            metrics: { waiting, served, avgWaitTime: 5 },
            recentActivity: recentActivity.map((l:any) => ({
                 ticket: l.ticket || 0,
                 time: new Date(l.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                 action: l.action,
                 details: l.details
            })),
            visitors: queueVisitors,
            lastCalledNumber: current ? current.ticketNumber : (queueVisitors.filter((v:any) => v.status === 'served').pop()?.ticketNumber || 0)
        };
    }
    
    // Admin Endpoints
    if (endpoint === '/admin/users') return DB.get('users');
    if (endpoint === '/admin/list') return DB.get('users').filter((u:any) => u.role === 'admin' || u.role === 'superadmin').map((u:any) => u.email);
    if (endpoint === '/admin/system-logs') return DB.get('logs').slice(0, 50); // Simplified
    if (endpoint === '/admin/logs') return []; // Audit logs stub

    return null;
  }
  
  async put(endpoint: string, body: any) {
      await this.delay();
      if (endpoint.includes('/queue/')) {
          const queueId = endpoint.split('/')[2];
          let updatedItem = null;
          DB.update('queues', (prev: any[]) => prev.map((q: any) => {
              if (q.id === queueId) {
                  updatedItem = { ...q, ...body };
                  return updatedItem;
              }
              return q;
          }));
          return updatedItem;
      }
      return null;
  }
  
  async delete(endpoint: string) {
      await this.delay();
      if (endpoint.includes('/queue/')) {
          const queueId = endpoint.split('/')[2];
          DB.update('queues', (prev: any[]) => prev.filter((q: any) => q.id !== queueId));
          // Clean up visitors
          DB.update('visitors', (prev: any[]) => prev.filter((v: any) => v.queueId !== queueId));
          return { success: true };
      }
      return null;
  }

  // --- HELPERS ---
  private getCurrentUser() {
      return JSON.parse(localStorage.getItem('qblink_user') || 'null');
  }

  private logAction(queueId: string, visitorId: string, action: string, details: string) {
      const logs = DB.get('logs') || [];
      // Find visitor ticket number
      const visitors = DB.get('visitors') || [];
      const visitor = visitors.find((v:any) => v.id === visitorId);
      
      DB.set('logs', [...logs, {
          id: crypto.randomUUID(),
          queueId,
          timestamp: new Date().toISOString(),
          action,
          ticket: visitor?.ticketNumber,
          details,
          user: 'System'
      }]);
  }
  
  // URL Helper (Mock)
  get currentUrl() { return 'http://mock-cloud.qblink.app'; }
  setBaseUrl() {} // No-op
}

export const api = new MockApi();
