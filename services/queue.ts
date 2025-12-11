
import { QueueData, QueueInfo, Visitor, ActivityLog, BusinessType, QueueFeatures } from '../types';
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
                  // 1. VIPs always on top (unless late logic applies, handled by order logic below)
                  if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                  
                  // Fallback for older data or manual adds without order
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

  getDefaultFeatures: (type: BusinessType): QueueFeatures => {
      switch(type) {
          case 'restaurant': return { vip: true, multiCounter: true, anonymousMode: false, sms: true };
          case 'clinic': return { vip: true, multiCounter: true, anonymousMode: true, sms: true };
          case 'bank': return { vip: true, multiCounter: true, anonymousMode: true, sms: false };
          case 'salon': return { vip: false, multiCounter: true, anonymousMode: false, sms: true };
          case 'retail': return { vip: false, multiCounter: true, anonymousMode: false, sms: false };
          case 'general': 
          default: return { vip: true, multiCounter: true, anonymousMode: false, sms: false };
      }
  },

  createQueue: async (userId: string, name: string, estimatedWaitTime?: number, type: BusinessType = 'general', features?: Partial<QueueFeatures>): Promise<QueueInfo> => {
      // Merge default features for type with any custom overrides
      const defaultFeatures = queueService.getDefaultFeatures(type);
      const finalFeatures = { ...defaultFeatures, ...features };

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
              businessType: type,
              features: finalFeatures,
              settings: { 
                  soundEnabled: true, 
                  soundVolume: 1, 
                  soundType: 'beep', 
                  themeColor: '#3b82f6', 
                  gracePeriodMinutes: 2 
              },
              isPaused: false,
              announcement: ''
          };
          await firebaseService.set(newQueueRef, newQueue);
          return newQueue;
      }
      return await api.post('/queue', { name, estimatedWaitTime, businessType: type, features: finalFeatures });
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

          await firebaseService.runTransaction(firebaseService.ref(firebaseService.db, `queues/${queueId}/counter`), (currentCounter: any) => {
              return (currentCounter || 0) + 1;
          }).then(res => {
              if (res.committed) ticketNumber = res.snapshot.val();
          });

          // Determine Order: Get max order from existing
          const vSnap = await firebaseService.get(firebaseService.ref(firebaseService.db, `visitors/${queueId}`));
          const vMap = vSnap.val() || {};
          const currentMaxOrder = Object.values(vMap).reduce((max: number, v: any) => Math.max(max, v.order || 0), 0);

          const newVisitor: Visitor = {
              id: visitorRef.key!,
              ticketNumber,
              name: name || `Guest ${ticketNumber}`,
              phoneNumber: phoneNumber || '',
              joinTime: new Date().toISOString(),
              status: 'waiting',
              source,
              isPriority: false,
              order: currentMaxOrder + 1, // Ensure new joins are at end
              isLate: false
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
  
  callNext: async (queueId: string, servedBy?: string) => {
      if (firebaseService.isAvailable) {
          const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
          const vSnap = await firebaseService.get(vRef);
          const visitorsMap = vSnap.val() || {};
          const visitors: Visitor[] = Object.keys(visitorsMap).map(k => ({...visitorsMap[k], id: k}));

          // Complete current serving
          const serving = visitors.find(v => v.status === 'serving' && (!servedBy || v.servedBy === servedBy || !v.servedBy));
          if (serving) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${serving.id}`), {
                  status: 'served',
                  servedTime: new Date().toISOString(),
                  isAlerting: false,
                  calledAt: null // clear grace timer
              });
          }

          // Find Next
          const next = visitors
              .filter(v => v.status === 'waiting')
              .sort((a,b) => {
                   // Respect order first (handles late people moved to end), then priority fallback
                   if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                   if (a.isPriority && !b.isPriority) return -1;
                   if (!a.isPriority && b.isPriority) return 1;
                   return a.ticketNumber - b.ticketNumber;
              })[0];

          if (next) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${next.id}`), {
                  status: 'serving',
                  isAlerting: true,
                  servingStartTime: new Date().toISOString(),
                  calledAt: new Date().toISOString(), // Start Grace Timer
                  servedBy: servedBy || 'Staff'
              });
              
              const logRef = firebaseService.push(firebaseService.ref(firebaseService.db, `logs/${queueId}`));
              await firebaseService.set(logRef, {
                  queueId,
                  ticket: next.ticketNumber,
                  action: 'call',
                  time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
                  rawTime: new Date().toISOString(),
                  user: servedBy || 'Staff',
                  email: 'staff@qblink.com'
              });
          }
          return;
      }
      return await api.post(`/queue/${queueId}/call`, { servedBy });
  },

  callByNumber: async (queueId: string, ticketNumber: number, servedBy?: string) => {
      if (firebaseService.isAvailable) {
          const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
          const vSnap = await firebaseService.get(vRef);
          const visitorsMap = vSnap.val() || {};
          const visitors: Visitor[] = Object.keys(visitorsMap).map(k => ({...visitorsMap[k], id: k}));

          const serving = visitors.find(v => v.status === 'serving' && (!servedBy || v.servedBy === servedBy || !v.servedBy));
          
          if (serving) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${serving.id}`), {
                  status: 'served',
                  servedTime: new Date().toISOString(),
                  isAlerting: false,
                  calledAt: null
              });
          }

          const target = visitors.find(v => v.ticketNumber === ticketNumber);
          if (target) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${target.id}`), {
                  status: 'serving',
                  isAlerting: true,
                  servingStartTime: new Date().toISOString(),
                  calledAt: new Date().toISOString(), // Start Grace Timer
                  servedBy: servedBy || 'Staff'
              });
              
              const logRef = firebaseService.push(firebaseService.ref(firebaseService.db, `logs/${queueId}`));
              await firebaseService.set(logRef, {
                  queueId,
                  ticket: target.ticketNumber,
                  action: 'call',
                  time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
                  rawTime: new Date().toISOString(),
                  user: servedBy || 'Staff',
                  email: 'staff@qblink.com'
              });
          }
          return;
      }
      return await api.post(`/queue/${queueId}/call-number`, { ticketNumber, servedBy });
  },

  confirmPresence: async (queueId: string, visitorId: string) => {
      // Logic for "I'm Coming"
      if (firebaseService.isAvailable) {
          // Stop alerting, keep serving, remove calledAt to stop grace timer logic
          await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${visitorId}`), { 
              isAlerting: false,
              calledAt: null, // Timer stops
              isLate: false
          });
          return;
      }
      return await api.post(`/queue/${queueId}/confirm`, { visitorId });
  },

  handleGracePeriodExpiry: async (queueId: string, gracePeriodMinutes: number) => {
      if (firebaseService.isAvailable) {
          const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
          const vSnap = await firebaseService.get(vRef);
          const visitorsMap = vSnap.val() || {};
          const visitors: Visitor[] = Object.keys(visitorsMap).map(k => ({...visitorsMap[k], id: k}));
          
          const now = Date.now();
          const graceMs = gracePeriodMinutes * 60 * 1000;

          // Find max order to push to back
          const maxOrder = visitors.reduce((max, v) => Math.max(max, v.order || 0), 0);
          let nextOrder = maxOrder + 1;

          const updates: any = {};
          let hasUpdates = false;

          visitors.forEach(v => {
              if (v.status === 'serving' && v.isAlerting && v.calledAt) {
                  const calledTime = new Date(v.calledAt).getTime();
                  if (now - calledTime > graceMs) {
                      // EXPIRED - Move to end
                      updates[`${v.id}/status`] = 'waiting';
                      updates[`${v.id}/isAlerting`] = false;
                      updates[`${v.id}/calledAt`] = null;
                      updates[`${v.id}/isLate`] = true;
                      updates[`${v.id}/order`] = nextOrder; // Move to end
                      updates[`${v.id}/servedBy`] = null; // Free up counter
                      
                      // Log the late event
                      const logKey = firebaseService.push(firebaseService.ref(firebaseService.db, `logs/${queueId}`)).key;
                      updates[`../logs/${queueId}/${logKey}`] = {
                          queueId,
                          ticket: v.ticketNumber,
                          action: 'late',
                          time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
                          rawTime: new Date().toISOString(),
                          user: 'System (Auto)',
                          email: 'system@qblink.com',
                          details: 'Auto-skipped due to no confirmation'
                      };

                      nextOrder++; // Increment for next late person if multiple
                      hasUpdates = true;
                  }
              }
          });

          if (hasUpdates) {
              await firebaseService.update(vRef, updates);
          }
      }
      // Note: Backend implementation would handle this via a cron or similar interval
  },

  recallVisitor: async (queueId: string, visitorId: string, servedBy?: string) => {
      if (firebaseService.isAvailable) {
          const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
          const vSnap = await firebaseService.get(vRef);
          const visitorsMap = vSnap.val() || {};
          const visitors: Visitor[] = Object.keys(visitorsMap).map(k => ({...visitorsMap[k], id: k}));

          const serving = visitors.find(v => v.status === 'serving' && (!servedBy || v.servedBy === servedBy || !v.servedBy));
          if (serving && serving.id !== visitorId) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${serving.id}`), {
                  status: 'served',
                  isAlerting: false,
                  calledAt: null
              });
          }

          await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${visitorId}`), {
              status: 'serving',
              isAlerting: true,
              servedBy: servedBy || 'Staff',
              calledAt: new Date().toISOString(), // Start Grace Timer again on recall
              isLate: false // Reset late status
          });
          return;
      }
      return await api.post(`/queue/${queueId}/recall`, { visitorId, servedBy });
  },

  takeBack: async (queueId: string, servedBy?: string) => {
      if (firebaseService.isAvailable) {
          const vRef = firebaseService.ref(firebaseService.db, `visitors/${queueId}`);
          const vSnap = await firebaseService.get(vRef);
          const visitorsMap = vSnap.val() || {};
          const visitors: Visitor[] = Object.keys(visitorsMap).map(k => ({...visitorsMap[k], id: k}));

          const serving = visitors.find(v => v.status === 'serving' && (!servedBy || v.servedBy === servedBy || !v.servedBy));
          if (serving) {
              await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${serving.id}`), {
                  status: 'waiting',
                  isAlerting: false,
                  servedBy: null,
                  calledAt: null
              });
          }
          return;
      }
      return await api.post(`/queue/${queueId}/take-back`, { servedBy });
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
          const updates: any = {};
          visitors.forEach((v, index) => {
              updates[`${v.id}/order`] = index + 1; // 1-based index
          });
          await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}`), updates);
          return; 
      }
      return await api.post(`/queue/${queueId}/reorder`, { visitors });
  },

  dismissAlert: async (queueId: string, visitorId: string) => {
      // Renamed to confirmPresence for clarity in new logic, but keeping for backward compat if needed
      return queueService.confirmPresence(queueId, visitorId);
  },

  triggerAlert: async (queueId: string, visitorId: string) => {
      if (firebaseService.isAvailable) {
           await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${visitorId}`), { 
               isAlerting: true,
               calledAt: new Date().toISOString() // Restart grace timer
           });
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

  autoSkipInactive: async (queueId: string, minutes: number) => {
      // Long-term service timeout logic (not grace period)
      const data = await queueService.getQueueData(queueId);
      const now = new Date().getTime();

      const expiredVisitors = data.visitors.filter(v => {
          if (v.status === 'serving' && v.servingStartTime && !v.isAlerting) { // Only check if confirmed present
              const startTime = new Date(v.servingStartTime).getTime();
              const diffMinutes = (now - startTime) / 60000;
              return diffMinutes > minutes;
          }
          return false;
      });

      for (const v of expiredVisitors) {
          if (firebaseService.isAvailable) {
               await firebaseService.update(firebaseService.ref(firebaseService.db, `visitors/${queueId}/${v.id}`), {
                  status: 'skipped',
                  servedTime: new Date().toISOString(),
                  isAlerting: false,
                  calledAt: null
               });
          } else {
               await queueService.leaveQueue(queueId, v.id);
          }
      }
  },

  getSystemLogs: async () => {
      return await api.get('/admin/system-logs');
  },

  exportStatsCSV: async (queueId: string, name: string) => {
      // ... existing code ...
      const data = await queueService.getQueueData(queueId);
      const headers = ['Ticket Number', 'Name', 'Phone', 'Status', 'Join Time', 'Served Time', 'Served By', 'Priority', 'Late'];
      const rows = data.visitors.map(v => [
          v.ticketNumber,
          v.name,
          v.phoneNumber || '',
          v.status,
          new Date(v.joinTime).toLocaleString(),
          v.servedTime ? new Date(v.servedTime).toLocaleString() : '',
          v.servedBy || '',
          v.isPriority ? 'Yes' : 'No',
          v.isLate ? 'Yes' : 'No'
      ]);
      // ... (rest of export logic remains same)
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${name.replace(/\s+/g, '_')}_stats_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
