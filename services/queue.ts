
import { QueueData, QueueInfo, Visitor, ActivityLog } from '../types';
import { api } from './api';
import { firebaseService } from './firebase';

export const queueService = {
  // --- READS ---
  
  getUserQueues: async (userId: string): Promise<QueueInfo[]> => {
      if (firebaseService.isAvailable) {
          try {
            const snapshot = await firebaseService.get(firebaseService.ref(firebaseService.db, `queues`));
            const val = snapshot.val();
            if (!val) return [];
            return Object.values(val).filter((q: any) => q.userId === userId) as QueueInfo[];
          } catch(e) { console.error(e); }
      }
      return await api.get('/queue');
  },

  getQueueInfo: async (queueId: string): Promise<QueueInfo | null> => {
      if (firebaseService.isAvailable) {
          const snapshot = await firebaseService.get(firebaseService.ref(firebaseService.db, `queues/${queueId}`));
          return snapshot.val();
      }
      return await api.get(`/queue/${queueId}/info`);
  },

  getQueueData: async (queueId: string): Promise<QueueData> => {
      if (firebaseService.isAvailable) {
          const qRef = firebaseService.ref(firebaseService.db, `queues/${queueId}`);
          const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
          const lRef = firebaseService.ref(firebaseService.db, `logs/${queueId}`);

          const [qSnap, vSnap, lSnap] = await Promise.all([
              firebaseService.get(qRef),
              firebaseService.get(vRef),
              firebaseService.get(lRef)
          ]);

          const queue = qSnap.val();
          if (!queue) throw new Error("Queue not found");

          const visitorsMap = vSnap.val() || {};
          const visitors: Visitor[] = Object.keys(visitorsMap).map(key => ({...visitorsMap[key], id: key}));
          
          const logsMap = lSnap.val() || {};
          const recentActivity = Object.values(logsMap).sort((a: any, b: any) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime()).slice(0, 50) as ActivityLog[];

          const waiting = visitors.filter(v => v.status === 'waiting').length;
          const served = visitors.filter(v => v.status === 'served').length;
          
          const lastCalled = visitors
            .filter(v => v.status === 'serving' || v.status === 'served')
            .sort((a,b) => b.ticketNumber - a.ticketNumber)[0]?.ticketNumber || 0;

          return {
              queueId,
              currentTicket: lastCalled,
              lastCalledNumber: lastCalled,
              metrics: { waiting, served, avgWaitTime: queue.estimatedWaitTime || 5 },
              visitors: visitors.sort((a,b) => {
                  if (a.isPriority && !b.isPriority) return -1;
                  if (!a.isPriority && b.isPriority) return 1;
                  return a.ticketNumber - b.ticketNumber;
              }),
              recentActivity
          };
      }
      return await api.get(`/queue/${queueId}/data`);
  },

  // --- WRITES (Actions) ---

  createQueue: async (userId: string, name: string, estimatedWaitTime?: number): Promise<QueueInfo> => {
      if (firebaseService.isAvailable) {
          const queuesRef = firebaseService.ref(firebaseService.db, 'queues');
          const newQueueRef = firebaseService.push(queuesRef);
          const newQueue: QueueInfo = {
              id: newQueueRef.key!,
              userId,
              name,
              code: Math.floor(100000 + Math.random() * 900000).toString(),
              status: 'active',
              createdAt: new Date().toISOString(),
              estimatedWaitTime: estimatedWaitTime || 5,
              settings: { soundEnabled: true, soundVolume: 1, soundType: 'beep' },
              isPaused: false,
              announcement: ''
          };
          await firebaseService.set(newQueueRef, newQueue);
          return newQueue;
      }
      return await api.post('/queue', { name, estimatedWaitTime });
  },

  updateQueue: async (userId: string, queueId: string, updates: Partial<QueueInfo>): Promise<QueueInfo | null> => {
      if (firebaseService.isAvailable) {
          await firebaseService.update(firebaseService.ref(firebaseService.db, `queues/${queueId}`), updates);
          const snap = await firebaseService.get(firebaseService.ref(firebaseService.db, `queues/${queueId}`));
          return snap.val();
      }
      return await api.put(`/queue/${queueId}`, updates);
  },

  deleteQueue: async (userId: string, queueId: string) => {
      if (firebaseService.isAvailable) {
          await firebaseService.remove(firebaseService.ref(firebaseService.db, `queues/${queueId}`));
          await firebaseService.remove(firebaseService.ref(firebaseService.db, `visitors/${queueId}`));
          await firebaseService.remove(firebaseService.ref(firebaseService.db, `logs/${queueId}`));
          return;
      }
      return await api.delete(`/queue/${queueId}`);
  },
  
  joinQueue: async (queueId: string, name: string, phoneNumber?: string, source: 'manual' | 'qr' = 'qr'): Promise<{ visitor: Visitor, queueData: QueueData }> => {
      if (firebaseService.isAvailable) {
          // 1. Check for duplicates if phoneNumber is provided
          if (phoneNumber) {
              const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
              const vSnap = await firebaseService.get(vRef);
              const visitorsMap = vSnap.val() || {};
              const existing = Object.values(visitorsMap).find((v: any) => 
                  v.phoneNumber === phoneNumber && 
                  (v.status === 'waiting' || v.status === 'serving')
              );
              if (existing) {
                  throw new Error("You are already in the queue.");
              }
          }

          const visitorRef = firebaseService.push(firebaseService.ref(firebaseService.db, `visitors/${queueId}`));
          const logRef = firebaseService.push(firebaseService.ref(firebaseService.db, `logs/${queueId}`));
          
          let ticketNumber = 1;

          await firebaseService.runTransaction(firebaseService.ref(firebaseService.db, `queues/${queueId}/counter`), (currentCounter) => {
              return (currentCounter || 0) + 1;
          }).then(res => {
              if (res.committed) ticketNumber = res.snapshot.val();
          });

          const newVisitor: Visitor = {
              id: visitorRef.key!,
              ticketNumber,
              name: name || `Guest ${ticketNumber}`,
              phoneNumber: phoneNumber || '',
              joinTime: new Date().toISOString(),
              status: 'waiting',
              source,
              isPriority: false
          };

          await firebaseService.set(visitorRef, newVisitor);
          
          await firebaseService.set(logRef, {
              queueId,
              ticket: ticketNumber,
              action: 'join',
              time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
              rawTime: new Date().toISOString(),
              user: 'System',
              email: 'system@qblink.com'
          });

          const data = await queueService.getQueueData(queueId);
          return { visitor: newVisitor, queueData: data };
      }
      return await api.post('/queue/join', { queueId, name, phoneNumber, source });
  },

  leaveQueue: async (queueId: string, visitorId: string) => {
      if (firebaseService.isAvailable) {
          await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${visitorId}`), { status: 'cancelled' });
          return;
      }
      return await api.post(`/queue/${queueId}/leave`, { visitorId });
  },
  
  callNext: async (queueId: string) => {
      if (firebaseService.isAvailable) {
          const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
          const vSnap = await firebaseService.get(vRef);
          const visitorsMap = vSnap.val() || {};
          const visitors: Visitor[] = Object.keys(visitorsMap).map(k => ({...visitorsMap[k], id: k}));

          const serving = visitors.find(v => v.status === 'serving');
          if (serving) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${serving.id}`), {
                  status: 'served',
                  servedTime: new Date().toISOString(),
                  isAlerting: false
              });
          }

          const next = visitors
              .filter(v => v.status === 'waiting')
              .sort((a,b) => {
                   if (a.isPriority && !b.isPriority) return -1;
                   if (!a.isPriority && b.isPriority) return 1;
                   return a.ticketNumber - b.ticketNumber;
              })[0];

          if (next) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${next.id}`), {
                  status: 'serving',
                  isAlerting: true
              });
              
              const logRef = firebaseService.push(firebaseService.ref(firebaseService.db, `logs/${queueId}`));
              await firebaseService.set(logRef, {
                  queueId,
                  ticket: next.ticketNumber,
                  action: 'call',
                  time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
                  rawTime: new Date().toISOString(),
                  user: 'Staff',
                  email: 'staff@qblink.com'
              });
          }
          return;
      }
      return await api.post(`/queue/${queueId}/call`, {});
  },

  callByNumber: async (queueId: string, ticketNumber: number) => {
      if (firebaseService.isAvailable) {
          const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
          const vSnap = await firebaseService.get(vRef);
          const visitorsMap = vSnap.val() || {};
          const visitors: Visitor[] = Object.keys(visitorsMap).map(k => ({...visitorsMap[k], id: k}));

          const serving = visitors.find(v => v.status === 'serving');
          if (serving) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${serving.id}`), {
                  status: 'served',
                  servedTime: new Date().toISOString(),
                  isAlerting: false
              });
          }

          const target = visitors.find(v => v.ticketNumber === ticketNumber);
          if (target) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${target.id}`), {
                  status: 'serving',
                  isAlerting: true
              });
              
              const logRef = firebaseService.push(firebaseService.ref(firebaseService.db, `logs/${queueId}`));
              await firebaseService.set(logRef, {
                  queueId,
                  ticket: target.ticketNumber,
                  action: 'call',
                  time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
                  rawTime: new Date().toISOString(),
                  user: 'Staff',
                  email: 'staff@qblink.com'
              });
          }
          return;
      }
      return await api.post(`/queue/${queueId}/call-number`, { ticketNumber });
  },

  recallVisitor: async (queueId: string, visitorId: string) => {
      if (firebaseService.isAvailable) {
          const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
          const vSnap = await firebaseService.get(vRef);
          const visitorsMap = vSnap.val() || {};
          const visitors: Visitor[] = Object.keys(visitorsMap).map(k => ({...visitorsMap[k], id: k}));

          const serving = visitors.find(v => v.status === 'serving');
          if (serving && serving.id !== visitorId) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${serving.id}`), {
                  status: 'served',
                  isAlerting: false
              });
          }

          await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${visitorId}`), {
              status: 'serving',
              isAlerting: true
          });
          return;
      }
      return await api.post(`/queue/${queueId}/recall`, { visitorId });
  },

  takeBack: async (queueId: string) => {
      if (firebaseService.isAvailable) {
          const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
          const vSnap = await firebaseService.get(vRef);
          const visitorsMap = vSnap.val() || {};
          const visitors: Visitor[] = Object.keys(visitorsMap).map(k => ({...visitorsMap[k], id: k}));

          const serving = visitors.find(v => v.status === 'serving');
          if (serving) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${serving.id}`), {
                  status: 'waiting',
                  isAlerting: false
              });
          }
          return;
      }
      return await api.post(`/queue/${queueId}/take-back`, {});
  },

  togglePriority: async (queueId: string, visitorId: string, isPriority: boolean) => {
      if (firebaseService.isAvailable) {
          await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${visitorId}`), { isPriority });
          return;
      }
      return await api.post(`/queue/${queueId}/priority`, { visitorId, isPriority });
  },

  reorderQueue: async (queueId: string, visitors: Visitor[]) => {
      if (firebaseService.isAvailable) {
          return; 
      }
      return await api.post(`/queue/${queueId}/reorder`, { visitors });
  },

  dismissAlert: async (queueId: string, visitorId: string) => {
      if (firebaseService.isAvailable) {
          await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${visitorId}`), { isAlerting: false });
          return;
      }
      return await api.post(`/queue/${queueId}/alert`, { visitorId, type: 'dismiss' });
  },

  triggerAlert: async (queueId: string, visitorId: string) => {
      if (firebaseService.isAvailable) {
           await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${visitorId}`), { isAlerting: true });
           return;
      }
      return await api.post(`/queue/${queueId}/alert`, { visitorId, type: 'trigger' });
  },

  clearQueue: async (queueId: string) => {
      if (firebaseService.isAvailable) {
          const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
          const vSnap = await firebaseService.get(vRef);
          const visitorsMap = vSnap.val() || {};
          
          const updates: any = {};
          Object.keys(visitorsMap).forEach(key => {
              if (visitorsMap[key].status === 'waiting') {
                  updates[`${key}/status`] = 'cancelled';
              }
          });
          
          if (Object.keys(updates).length > 0) {
              await firebaseService.update(vRef, updates);
          }
          return;
      }
      return await api.post(`/queue/${queueId}/clear`, {});
  },

  getSystemLogs: async () => {
      return await api.get('/admin/system-logs');
  },

  exportUserData: (userId: string) => {
      const dataStr = localStorage.getItem('qblink_db_queues');
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr || '{}');
      const exportFileDefaultName = 'qblink_backup.json';
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
  },

  importUserData: async (userId: string, file: File) => {
      return new Promise<boolean>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e: any) => {
              try {
                  const data = JSON.parse(e.target.result);
                  if(Array.isArray(data)) {
                       localStorage.setItem('qblink_db_queues', JSON.stringify(data));
                       resolve(true);
                  } else {
                       resolve(false);
                  }
              } catch(e) {
                  resolve(false);
              }
          };
          reader.readAsText(file);
      });
  }
};
