
import { User, QueueInfo, QueueData, Visitor, ActivityLog } from '../types';
import { firebaseService } from './firebase';

// Storage Keys
const KEYS = {
  USERS: 'qblink_db_users',
  QUEUES: 'qblink_db_queues',
  VISITORS: 'qblink_db_visitors',
  LOGS: 'qblink_db_logs'
};

// Broadcast Channel for Real-time events (Local fallback)
const channel = new BroadcastChannel('qblink_realtime');

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockBackendService {
  private users: User[] = [];
  private queues: QueueInfo[] = [];
  private visitors: Visitor[] = [];
  private logs: any[] = [];
  private adminAuditLogs: any[] = []; // Fixed: Added missing property
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
      // If Firebase is available, we rely on on-demand fetching for Auth to ensure fresh data
      // Local arrays are kept for fallback
      if (!firebaseService.isAvailable) {
          this.loadLocal();
          channel.onmessage = (event) => {
             if (event.data.type === 'SYNC_DB') this.loadLocal();
          };
      }
      this.initialized = true;
  }

  private loadLocal() {
    try {
      this.users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      this.queues = JSON.parse(localStorage.getItem(KEYS.QUEUES) || '[]');
      this.visitors = JSON.parse(localStorage.getItem(KEYS.VISITORS) || '[]');
      this.logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
      this.adminAuditLogs = JSON.parse(localStorage.getItem('qblink_admin_audit') || '[]');
      this.ensureSuperAdmin();
    } catch (e) {
      console.error("Failed to load mock DB", e);
    }
  }

  private ensureSuperAdmin() {
      const specificAdminEmail = 'ismailnsm75@gmail.com';
      const adminUser = this.users.find(u => u.email === specificAdminEmail);
      if (adminUser && adminUser.role !== 'superadmin') {
          adminUser.role = 'superadmin';
          this.save();
      }
  }

  private async save() {
    if (firebaseService.isAvailable) {
        // In Cloud Mode, we write directly via handlers
        return; 
    }
    
    // Local Mode
    localStorage.setItem(KEYS.USERS, JSON.stringify(this.users));
    localStorage.setItem(KEYS.QUEUES, JSON.stringify(this.queues));
    localStorage.setItem(KEYS.VISITORS, JSON.stringify(this.visitors));
    localStorage.setItem(KEYS.LOGS, JSON.stringify(this.logs));
    localStorage.setItem('qblink_admin_audit', JSON.stringify(this.adminAuditLogs));
  }

  // --- HANDLERS ---

  async handleRequest(method: string, endpoint: string, body?: any, user?: User): Promise<any> {
    
    // --- CLOUD AUTH & ADMIN HANDLERS (Firebase) ---
    if (firebaseService.isAvailable) {
        if (endpoint === '/auth/signup') {
            const { email, password, businessName } = body;
            
            // Check for existing user
            const usersRef = firebaseService.ref(firebaseService.db, 'users');
            const snapshot = await firebaseService.get(usersRef);
            const users = snapshot.val() ? Object.values(snapshot.val()) : [];
            
            if (users.find((u: any) => u.email === email)) {
                throw new Error("Email already exists");
            }

            // FORCE ADMIN ROLE FOR SPECIFIC EMAIL
            const role = email.toLowerCase() === 'ismailnsm75@gmail.com' ? 'superadmin' : 'owner';
            
            const newUser: User = {
                id: Math.random().toString(36).substr(2, 9),
                email,
                businessName,
                role: role,
                isVerified: true, 
                joinedAt: new Date().toISOString()
            };

            await firebaseService.set(firebaseService.ref(firebaseService.db, `users/${newUser.id}`), newUser);
            return { user: newUser, token: 'cloud_token_' + newUser.id };
        }

        if (endpoint === '/auth/login') {
            const { email, password } = body;
            
            const usersRef = firebaseService.ref(firebaseService.db, 'users');
            const snapshot = await firebaseService.get(usersRef);
            const usersMap = snapshot.val() || {};
            const userFound: any = Object.values(usersMap).find((u: any) => u.email === email);

            if (!userFound) throw new Error("Invalid credentials");
            
            // Auto-promote superadmin in cloud if missing
            if (userFound.email.toLowerCase() === 'ismailnsm75@gmail.com' && userFound.role !== 'superadmin') {
                userFound.role = 'superadmin';
                await firebaseService.update(firebaseService.ref(firebaseService.db, `users/${userFound.id}`), { role: 'superadmin' });
            }

            return { user: userFound, token: 'cloud_token_' + userFound.id };
        }

        if (endpoint === '/admin/users') {
            const snapshot = await firebaseService.get(firebaseService.ref(firebaseService.db, 'users'));
            const val = snapshot.val();
            return val ? Object.values(val) : [];
        }

        if (endpoint === '/admin/list') {
            const snapshot = await firebaseService.get(firebaseService.ref(firebaseService.db, 'users'));
            const users = snapshot.val() ? Object.values(snapshot.val()) : [];
            return users.filter((u: any) => u.role === 'admin' || u.role === 'superadmin').map((u: any) => u.email);
        }

        if (endpoint === '/admin/add') {
            const snapshot = await firebaseService.get(firebaseService.ref(firebaseService.db, 'users'));
            const users = snapshot.val() ? Object.values(snapshot.val()) : [];
            const target: any = users.find((u: any) => u.email === body.email);
            if (target) {
                await firebaseService.update(firebaseService.ref(firebaseService.db, `users/${target.id}`), { role: 'admin' });
            }
            return { success: true };
        }

        if (endpoint === '/admin/remove') {
            const snapshot = await firebaseService.get(firebaseService.ref(firebaseService.db, 'users'));
            const users = snapshot.val() ? Object.values(snapshot.val()) : [];
            const target: any = users.find((u: any) => u.email === body.email);
            if (target && target.role !== 'superadmin') {
                await firebaseService.update(firebaseService.ref(firebaseService.db, `users/${target.id}`), { role: 'owner' });
            }
            return { success: true };
        }
        
        if (endpoint === '/admin/logs') {
             const snapshot = await firebaseService.get(firebaseService.ref(firebaseService.db, 'audit_logs'));
             const val = snapshot.val();
             return val ? Object.values(val).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];
        }

        if (endpoint === '/admin/log') {
             const logRef = firebaseService.push(firebaseService.ref(firebaseService.db, 'audit_logs'));
             await firebaseService.set(logRef, {
                 id: logRef.key,
                 adminEmail: body.adminEmail,
                 action: body.action,
                 target: body.target,
                 timestamp: new Date().toISOString()
             });
             return { success: true };
        }
        
        if (endpoint === '/admin/system-logs') {
             return [];
        }
    }

    // --- LOCAL FALLBACK LOGIC (Original) ---
    await delay(50); 
    this.loadLocal(); 

    if (endpoint === '/auth/signup') {
      const { email, password, businessName } = body;
      if (this.users.find(u => u.email === email)) throw new Error("Email already exists");
      
      const role = email.toLowerCase() === 'ismailnsm75@gmail.com' ? 'superadmin' : 'owner';
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        businessName,
        role: role,
        isVerified: true, 
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

      if (user.email.toLowerCase() === 'ismailnsm75@gmail.com' && user.role !== 'superadmin') {
          user.role = 'superadmin';
          this.save();
      }
      return { user, token: 'mock_token_' + user.id };
    }

    // --- QUEUES (Local only - Cloud uses queueService direct) ---
    if (endpoint === '/queue' && method === 'GET') {
      return this.queues.filter(q => q.userId === user?.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (endpoint === '/queue' && method === 'POST') {
      const { name, estimatedWaitTime, businessType, features, location, id } = body;
      
      if (id && this.queues.find(q => q.id === id)) {
          // If queue exists (hydration), update/return it
          const existing = this.queues.find(q => q.id === id)!;
          if (name) existing.name = name; // Update name if provided during hydration
          if (location) existing.location = location;
          this.save();
          return existing;
      }

      const newQueue: QueueInfo = {
        id: id || Math.random().toString(36).substr(2, 9),
        userId: user?.id || 'demo-user', 
        name,
        location,
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        estimatedWaitTime: estimatedWaitTime || 5,
        settings: { soundEnabled: true, soundVolume: 1, soundType: 'beep', themeColor: '#3b82f6', gracePeriodMinutes: 2 },
        isPaused: false,
        announcement: '',
        businessType: businessType || 'general',
        features: features || { vip: true, multiCounter: true, anonymousMode: false, sms: false }
      };

      this.queues.push(newQueue);
      this.save();
      return newQueue;
    }

    // --- ADMIN (Local) ---
    if (endpoint === '/admin/users') {
        return this.users;
    }
    
    if (endpoint === '/admin/list') {
        return this.users.filter(u => u.role === 'admin' || u.role === 'superadmin').map(u => u.email);
    }

    if (endpoint === '/admin/add') {
        const u = this.users.find(u => u.email === body.email);
        if (u) { u.role = 'admin'; this.save(); }
        return { success: true };
    }

    if (endpoint === '/admin/remove') {
        const u = this.users.find(u => u.email === body.email);
        if (u && u.role !== 'superadmin') { u.role = 'owner'; this.save(); }
        return { success: true };
    }

    if (endpoint === '/admin/log') {
        this.adminAuditLogs.unshift({
            id: Math.random().toString(36).substr(2,9),
            adminEmail: body.adminEmail,
            action: body.action,
            target: body.target,
            timestamp: new Date().toISOString()
        });
        this.save();
        return { success: true };
    }

    if (endpoint === '/admin/logs') {
        return this.adminAuditLogs;
    }

    if (endpoint === '/admin/system-logs') {
        return this.logs;
    }

    return {};
  }
}

export const mockBackend = new MockBackendService();
