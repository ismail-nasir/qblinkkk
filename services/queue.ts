
import { QueueData, QueueInfo, Visitor, QueueFeatures, BusinessType, LocationInfo } from '../types';
import { firebaseService } from './firebase';
// @ts-ignore
import { 
    ref, 
    onValue, 
    push, 
    set, 
    update, 
    get, 
    remove, 
    query, 
    orderByChild,
    equalTo,
    limitToLast,
    runTransaction
} from 'firebase/database';

// Helper to convert object snapshot to array
const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (!data) return [];
    return Object.entries(data).map(([key, value]: [string, any]) => ({ id: key, ...value }));
};

export const queueService = {

  // --- LOCATIONS ---

  getLocations: (businessId: string, callback: (locs: LocationInfo[]) => void) => {
      if (!firebaseService.db) return () => {};
      const locationsRef = ref(firebaseService.db, `businesses/${businessId}/locations`);
      return onValue(locationsRef, (snapshot: any) => {
          const locs = snapshotToArray(snapshot);
          locs.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
          callback(locs as LocationInfo[]);
      });
  },

  createLocation: async (businessId: string, name: string) => {
      if (!firebaseService.db) throw new Error("Database not connected");
      const locationsRef = ref(firebaseService.db, `businesses/${businessId}/locations`);
      const newLocRef = push(locationsRef);
      await set(newLocRef, { id: newLocRef.key, name, createdAt: Date.now() });
      return { id: newLocRef.key!, name };
  },

  // --- QUEUES ---

  getLocationQueues: (businessId: string, locationId: string, callback: (queues: QueueInfo[]) => void) => {
      if (!firebaseService.db) return () => {};
      const queuesRef = ref(firebaseService.db, `businesses/${businessId}/locations/${locationId}/queues`);
      return onValue(queuesRef, (snapshot: any) => {
          const queues = snapshotToArray(snapshot);
          queues.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
          callback(queues as QueueInfo[]);
      });
  },

  getUserQueues: async (businessId: string): Promise<QueueInfo[]> => {
      if (!firebaseService.db) return [];
      const locsRef = ref(firebaseService.db, `businesses/${businessId}/locations`);
      const snapshot = await get(locsRef);
      const locations = snapshot.val();
      if (!locations) return [];

      let allQueues: QueueInfo[] = [];
      Object.values(locations).forEach((loc: any) => {
          if (loc.queues) allQueues = [...allQueues, ...Object.values(loc.queues) as QueueInfo[]];
      });
      return allQueues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createQueue: async (businessId: string, name: string, wait: number, type: BusinessType, features: QueueFeatures, locationId: string) => {
      if (!firebaseService.db) throw new Error("Database not connected");
      const queuesRef = ref(firebaseService.db, `businesses/${businessId}/locations/${locationId}/queues`);
      const newQueueRef = push(queuesRef);
      const id = newQueueRef.key!;
      
      const newQueue: QueueInfo = {
          id, businessId, locationId, name,
          code: Math.floor(100000 + Math.random() * 900000).toString(),
          status: 'active',
          createdAt: new Date().toISOString(),
          estimatedWaitTime: wait || 5,
          businessType: type,
          features: features,
          settings: { 
              soundEnabled: true, soundVolume: 1, soundType: 'beep', 
              themeColor: '#3b82f6', gracePeriodMinutes: 2, autoSkipMinutes: 0,
              enableSMS: false, smsTemplate: "Hello {name}, it's your turn at {queueName}!"
          },
          isPaused: false, announcement: '', currentTicketSequence: 0
      };

      await set(newQueueRef, newQueue);
      await set(ref(firebaseService.db, `businesses/${businessId}/locations/${locationId}/queues/${id}/metrics_counter`), {
          waiting: 0, served: 0, cancelled: 0, total_service_time: 0, service_count: 0
      });
      await set(ref(firebaseService.db, `queue_lookup/${id}`), { businessId, locationId });
      return newQueue;
  },

  findQueuePath: async (queueId: string): Promise<{ businessId: string, locationId: string, queue: QueueInfo } | null> => {
      if (!firebaseService.db) return null;
      const lookupRef = ref(firebaseService.db, `queue_lookup/${queueId}`);
      const lookupSnap = await get(lookupRef);
      if (!lookupSnap.exists()) return null;
      const { businessId, locationId } = lookupSnap.val();
      
      const queueRef = ref(firebaseService.db, `businesses/${businessId}/locations/${locationId}/queues/${queueId}`);
      const queueSnap = await get(queueRef);
      if (!queueSnap.exists()) return null;

      return { businessId, locationId, queue: { id: queueId, ...queueSnap.val() } };
  },

  getQueueInfo: async (queueId: string): Promise<QueueInfo | null> => {
      const result = await queueService.findQueuePath(queueId);
      return result ? result.queue : null;
  },

  // --- REAL-TIME DATA ---

  streamQueueData: (queueId: string, callback: (data: QueueData | null, error?: string) => void, includeLogs: boolean = true) => {
      if (!firebaseService.db) {
          callback(null, "Database unavailable");
          return () => {};
      }

      queueService.findQueuePath(queueId).then((path) => {
          if (!path) {
              callback(null, "Queue not found");
              return;
          }
          const { businessId, locationId } = path;
          const basePath = `businesses/${businessId}/locations/${locationId}/queues/${queueId}`;
          const visitorsRef = ref(firebaseService.db!, `${basePath}/visitors`);
          const metricsRef = ref(firebaseService.db!, `${basePath}/metrics_counter`);

          const unsubVisitors = onValue(visitorsRef, (snapshot: any) => {
              const visitors = snapshotToArray(snapshot) as Visitor[];
              
              get(metricsRef).then((mSnap) => {
                  const metrics = mSnap.val() || { waiting: 0, served: 0, avgWaitTime: path.queue.estimatedWaitTime || 5 };
                  
                  const waitingVisitors = visitors.filter(v => v.status === 'waiting');
                  const servingVisitors = visitors.filter(v => v.status === 'serving');
                  
                  // SORTING LOGIC: Priority -> Order -> Late -> TicketNumber
                  const allActive = [...servingVisitors, ...waitingVisitors];
                  allActive.sort((a, b) => {
                      if (a.status === 'serving' && b.status !== 'serving') return -1;
                      if (a.status !== 'serving' && b.status === 'serving') return 1;
                      
                      // Explicit Reorder
                      const orderA = a.order ?? 999999;
                      const orderB = b.order ?? 999999;
                      if (orderA !== orderB) return orderA - orderB;

                      // VIP
                      if (a.isPriority && !b.isPriority) return -1;
                      if (!a.isPriority && b.isPriority) return 1;

                      // Late
                      if (a.isLate && !b.isLate) return 1;
                      if (!a.isLate && b.isLate) return -1;

                      // FCFS
                      return a.ticketNumber - b.ticketNumber;
                  });

                  const lastCalled = servingVisitors.length > 0 
                      ? Math.max(...servingVisitors.map(v => v.ticketNumber))
                      : 0;

                  const data: QueueData = {
                      queueId,
                      currentTicket: lastCalled,
                      lastCalledNumber: lastCalled,
                      metrics: {
                          waiting: waitingVisitors.length,
                          served: metrics.served || 0,
                          avgWaitTime: metrics.avgWaitTime || 5,
                          averageRating: 0
                      },
                      visitors: allActive,
                      recentActivity: []
                  };

                  if (includeLogs) {
                      const logsRef = query(ref(firebaseService.db!, `${basePath}/logs`), orderByChild('timestamp'), limitToLast(20));
                      get(logsRef).then((lSnap) => {
                          const logsRaw = snapshotToArray(lSnap) as any[];
                          data.recentActivity = logsRaw.sort((a,b) => b.timestamp - a.timestamp).map(l => ({
                              ...l,
                              time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''
                          }));
                          callback(data);
                      }).catch(() => callback(data));
                  } else {
                      callback(data);
                  }
              });
          });

          return unsubVisitors;
      });

      return () => {};
  },

  getQueueData: async (queueId: string): Promise<QueueData> => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) throw new Error("Queue not found");
      const { businessId, locationId } = path;
      const basePath = `businesses/${businessId}/locations/${locationId}/queues/${queueId}`;
      
      const vSnap = await get(ref(firebaseService.db!, `${basePath}/visitors`));
      const visitors = snapshotToArray(vSnap) as Visitor[];
      
      const mSnap = await get(ref(firebaseService.db!, `${basePath}/metrics_counter`));
      const metrics = mSnap.val() || { waiting: 0, served: 0, avgWaitTime: path.queue.estimatedWaitTime || 5 };

      const waitingVisitors = visitors.filter(v => v.status === 'waiting');
      const servingVisitors = visitors.filter(v => v.status === 'serving');
      
      const allActive = [...servingVisitors, ...waitingVisitors].sort((a, b) => {
          if (a.status === 'serving' && b.status !== 'serving') return -1;
          if (a.status !== 'serving' && b.status === 'serving') return 1;
          if (a.isPriority && !b.isPriority) return -1;
          if (!a.isPriority && b.isPriority) return 1;
          return a.ticketNumber - b.ticketNumber;
      });

      const lastCalled = servingVisitors.length > 0 ? Math.max(...servingVisitors.map(v => v.ticketNumber)) : 0;

      return {
          queueId,
          currentTicket: lastCalled,
          lastCalledNumber: lastCalled,
          metrics: {
              waiting: waitingVisitors.length,
              served: metrics.served || 0,
              avgWaitTime: metrics.avgWaitTime || 5,
              averageRating: 0
          },
          visitors: allActive,
          recentActivity: []
      };
  },

  // --- ACTIONS ---

  joinQueue: async (queueId: string, name: string, phoneNumber?: string, source: 'manual' | 'qr' = 'qr') => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) throw new Error("Queue not found");
      const { businessId, locationId } = path;
      const basePath = `businesses/${businessId}/locations/${locationId}/queues/${queueId}`;
      
      if (phoneNumber) {
          try {
              const visitorsRef = ref(firebaseService.db!, `${basePath}/visitors`);
              const snapshot = await get(visitorsRef);
              if (snapshot.exists()) {
                  const all = snapshotToArray(snapshot) as Visitor[];
                  const duplicate = all.find(v => v.phoneNumber === phoneNumber && v.status === 'waiting');
                  if (duplicate) return { visitor: duplicate, queueData: null, isDuplicate: true };
              }
          } catch (e) {}
      }

      const seqResult = await runTransaction(ref(firebaseService.db!, `${basePath}/currentTicketSequence`), (currentSeq) => (currentSeq || 0) + 1);
      const currentSeq = seqResult.snapshot.val();

      const newVisitorRef = push(ref(firebaseService.db!, `${basePath}/visitors`));
      const visitorData: Visitor = {
          id: newVisitorRef.key!,
          ticketNumber: currentSeq,
          name: name || `Guest ${currentSeq}`,
          phoneNumber: phoneNumber || '',
          joinTime: new Date().toISOString(),
          status: 'waiting',
          source: source,
          isPriority: false,
          isLate: false
      };

      await set(newVisitorRef, visitorData);
      await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter/waiting`), (c) => (c || 0) + 1);
      
      await push(ref(firebaseService.db!, `${basePath}/logs`), {
          timestamp: Date.now(), action: 'join', ticket: currentSeq, user: 'System'
      });

      return { visitor: visitorData, queueData: null };
  },

  updateVisitorStatus: async (queueId: string, visitorId: string, updates: Partial<Visitor>, logAction?: string, user?: string) => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) return;
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${queueId}`;
      const vRef = ref(firebaseService.db!, `${basePath}/visitors/${visitorId}`);
      
      const snap = await get(vRef);
      if (!snap.exists()) return;
      const current = snap.val();

      await update(vRef, updates);

      if (logAction === 'complete' && current.status === 'serving') {
          await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter`), (m) => {
              if (!m) m = { served: 0, service_count: 0, total_service_time: 0 };
              m.served = (m.served || 0) + 1;
              return m;
          });
      } else if (logAction === 'call' && current.status === 'waiting') {
          await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter/waiting`), (c) => Math.max(0, (c || 0) - 1));
      } else if ((logAction === 'leave' || updates.status === 'cancelled') && current.status === 'waiting') {
          await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter/waiting`), (c) => Math.max(0, (c || 0) - 1));
          await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter/cancelled`), (c) => (c || 0) + 1);
      }

      if (logAction) {
          await push(ref(firebaseService.db!, `${basePath}/logs`), {
              timestamp: Date.now(), action: logAction, ticket: current.ticketNumber, user: user || 'Staff'
          });
      }
  },

  callNext: async (queueId: string, counterName: string) => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) return;
      
      // Fetch fresh data
      const data = await queueService.getQueueData(queueId);
      const { visitors } = data;

      // 1. Mark current 'serving' as 'served' (only if assigned to this counter OR unassigned)
      const current = visitors.find(v => v.status === 'serving' && (!v.servedBy || v.servedBy === counterName));
      if (current) {
          await queueService.updateVisitorStatus(queueId, current.id, {
              status: 'served',
              servedTime: new Date().toISOString(),
              isAlerting: false
          }, 'complete', counterName);
      }
      
      // 2. Find Next - Sort fresh data locally to guarantee correctness
      const waitingVisitors = visitors.filter(v => v.status === 'waiting');
      waitingVisitors.sort((a, b) => {
          // Explicit Reorder (Drag & Drop)
          const orderA = a.order ?? 999999;
          const orderB = b.order ?? 999999;
          if (orderA !== orderB) return orderA - orderB;

          // Priority
          if (a.isPriority && !b.isPriority) return -1;
          if (!a.isPriority && b.isPriority) return 1;

          // Late
          if (a.isLate && !b.isLate) return 1;
          if (!a.isLate && b.isLate) return -1;

          // FCFS
          return a.ticketNumber - b.ticketNumber;
      });

      const next = waitingVisitors[0];
      
      if (next) {
          await queueService.updateVisitorStatus(queueId, next.id, {
              status: 'serving',
              isAlerting: true,
              servingStartTime: new Date().toISOString(),
              calledAt: new Date().toISOString(),
              servedBy: counterName
          }, 'call', counterName);
      }
  },

  // --- AUTOMATION ---

  handleGracePeriodExpiry: async (queueId: string, minutes: number) => {
      const path = await queueService.findQueuePath(queueId);
      if(!path) return;
      const data = await queueService.getQueueData(queueId);
      const now = Date.now();
      const expiryMs = minutes * 60 * 1000;

      data.visitors.filter(v => v.status === 'serving' && v.isAlerting && v.calledAt).forEach(async (v) => {
          if (now - new Date(v.calledAt!).getTime() > expiryMs) {
              await queueService.updateVisitorStatus(queueId, v.id, {
                  status: 'waiting', isAlerting: false, isLate: true, calledAt: undefined, servedBy: undefined
              }, 'late', 'System');
              await runTransaction(ref(firebaseService.db!, `businesses/${path.businessId}/locations/${path.locationId}/queues/${queueId}/metrics_counter/waiting`), (c) => (c || 0) + 1);
          }
      });
  },

  autoSkipInactive: async (queueId: string, minutes: number) => {
      const data = await queueService.getQueueData(queueId);
      const now = Date.now();
      const expiryMs = minutes * 60 * 1000;
      data.visitors.filter(v => v.status === 'serving' && !v.isAlerting && v.servingStartTime).forEach(async (v) => {
          if (now - new Date(v.servingStartTime!).getTime() > expiryMs) {
              await queueService.updateVisitorStatus(queueId, v.id, { status: 'served', servedTime: new Date().toISOString() }, 'complete', 'System');
          }
      });
  },

  // --- ACTIONS ---
  
  leaveQueue: (qid: string, vid: string) => queueService.updateVisitorStatus(qid, vid, { status: 'cancelled' }, 'leave'),
  confirmPresence: (qid: string, vid: string) => queueService.updateVisitorStatus(qid, vid, { isAlerting: false }),
  triggerAlert: (qid: string, vid: string) => queueService.updateVisitorStatus(qid, vid, { isAlerting: true, calledAt: new Date().toISOString() }),
  
  takeBack: async (qid: string, counter: string) => {
      const data = await queueService.getQueueData(qid);
      const current = data.visitors.find(v => v.status === 'serving' && v.servedBy === counter);
      if (current) {
          const path = await queueService.findQueuePath(qid);
          if (path) {
              await queueService.updateVisitorStatus(qid, current.id, { status: 'waiting', isAlerting: false, servedBy: undefined });
              await runTransaction(ref(firebaseService.db!, `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}/metrics_counter/waiting`), (c) => (c || 0) + 1);
          }
      }
  },
  
  submitFeedback: (qid: string, vid: string, rating: number, feedback?: string) => queueService.updateVisitorStatus(qid, vid, { rating, feedback }),
  
  deleteQueue: async (uid: string, qid: string) => {
      const path = await queueService.findQueuePath(qid);
      if(path) {
          await remove(ref(firebaseService.db!, `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`));
          await remove(ref(firebaseService.db!, `queue_lookup/${qid}`));
      }
  },

  hydrateQueue: async (qid: string, name: string, location?: string) => { console.log("Demo Hydration"); },
  getDefaultFeatures: (t: any) => ({ vip: false, multiCounter: false, anonymousMode: false, sms: false }),
  
  updateQueue: async (uid: string, qid: string, data: any) => {
      const path = await queueService.findQueuePath(qid);
      if(path) {
          await update(ref(firebaseService.db!, `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`), data);
          return { ...path.queue, ...data };
      }
      return null;
  },
  
  exportStatsCSV: async (queueId: string, queueName: string) => {
      const data = await queueService.getQueueData(queueId);
      const headers = "Ticket,Name,JoinTime,Status,ServedBy,Rating,Comments\n";
      const rows = data.visitors.map(v => 
          `${v.ticketNumber},"${v.name}",${v.joinTime},${v.status},${v.servedBy || ''},${v.rating || ''},"${v.feedback || ''}"`
      ).join("\n");
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${queueName}_Stats.csv`;
      a.click();
  },
  
  callByNumber: async (qid: string, num: number, counter: string) => {
      const data = await queueService.getQueueData(qid);
      const target = data.visitors.find(v => v.ticketNumber === num);
      if (target) {
           await queueService.updateVisitorStatus(qid, target.id, { 
               status: 'serving', isAlerting: true, servedBy: counter, calledAt: new Date().toISOString() 
           }, 'call', counter);
      }
  },
  
  togglePriority: (qid: string, vid: string, isPriority: boolean) => queueService.updateVisitorStatus(qid, vid, { isPriority }),
  
  clearQueue: async (qid: string) => {
      const path = await queueService.findQueuePath(qid);
      if(!path) return;
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`;
      const snap = await get(ref(firebaseService.db!, `${basePath}/visitors`));
      if (snap.exists()) {
          const visitors = snapshotToArray(snap) as Visitor[];
          const updates: any = {};
          let count = 0;
          visitors.forEach(v => { 
              if(v.status === 'waiting') {
                  updates[`${basePath}/visitors/${v.id}/status`] = 'cancelled'; 
                  count++;
              }
          });
          if (count > 0) {
              await update(ref(firebaseService.db!), updates);
              await set(ref(firebaseService.db!, `${basePath}/metrics_counter/waiting`), 0);
              await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter/cancelled`), (c) => (c||0) + count);
          }
      }
  },
  
  reorderQueue: async (qid: string, visitors: Visitor[]) => {
      const path = await queueService.findQueuePath(qid);
      if(!path) return;
      const updates: any = {};
      visitors.forEach((v, idx) => {
          updates[`businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}/visitors/${v.id}/order`] = idx + 1;
      });
      await update(ref(firebaseService.db!), updates);
  },
  
  bulkUpdateVisitorStatus: async (queueId: string, visitorIds: string[], status: 'served' | 'skipped' | 'cancelled') => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) return;
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${queueId}`;
      const updates: any = {};
      const now = new Date().toISOString();
      const count = visitorIds.length;

      visitorIds.forEach(id => {
          updates[`${basePath}/visitors/${id}/status`] = status;
          if (status === 'served') {
              updates[`${basePath}/visitors/${id}/servedTime`] = now;
              updates[`${basePath}/visitors/${id}/isAlerting`] = false;
          }
      });

      if (status === 'served') {
          await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter`), (m) => {
              if(!m) m={waiting:0, served:0};
              m.waiting = Math.max(0, (m.waiting||0) - count);
              m.served = (m.served||0) + count;
              return m;
          });
      } else {
          await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter`), (m) => {
              if(!m) m={waiting:0, cancelled:0};
              m.waiting = Math.max(0, (m.waiting||0) - count);
              m.cancelled = (m.cancelled||0) + count;
              return m;
          });
      }
      
      await update(ref(firebaseService.db!), updates);
  },

  getSystemLogs: async () => [], exportUserData: () => {}, importUserData: async () => true
};
