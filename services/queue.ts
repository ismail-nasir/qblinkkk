
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
    orderByChild 
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
          // Sort by creation time
          locs.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
          callback(locs as LocationInfo[]);
      });
  },

  createLocation: async (businessId: string, name: string) => {
      if (!firebaseService.db) throw new Error("Database not connected");
      const locationsRef = ref(firebaseService.db, `businesses/${businessId}/locations`);
      const newLocRef = push(locationsRef);
      const newLoc = {
          id: newLocRef.key,
          name,
          createdAt: Date.now()
      };
      await set(newLocRef, newLoc);
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
          if (loc.queues) {
              allQueues = [...allQueues, ...Object.values(loc.queues) as QueueInfo[]];
          }
      });
      return allQueues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createQueue: async (
      businessId: string, 
      name: string, 
      wait: number, 
      type: BusinessType, 
      features: QueueFeatures, 
      locationId: string 
  ) => {
      if (!firebaseService.db) throw new Error("Database not connected");
      
      const queuesRef = ref(firebaseService.db, `businesses/${businessId}/locations/${locationId}/queues`);
      const newQueueRef = push(queuesRef);
      const id = newQueueRef.key!;
      
      const newQueue: QueueInfo = {
          id,
          businessId,
          locationId,
          name,
          code: Math.floor(100000 + Math.random() * 900000).toString(),
          status: 'active',
          createdAt: new Date().toISOString(),
          estimatedWaitTime: wait || 5,
          businessType: type,
          features: features,
          settings: { 
              soundEnabled: true, 
              soundVolume: 1, 
              soundType: 'beep', 
              themeColor: '#3b82f6', 
              gracePeriodMinutes: 2,
              autoSkipMinutes: 0
          },
          isPaused: false,
          announcement: '',
          currentTicketSequence: 0
      };

      await set(newQueueRef, newQueue);
      
      // Create global lookup
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

      return {
          businessId,
          locationId,
          queue: { id: queueId, ...queueSnap.val() }
      };
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

      let unsubVisitors: any = null;
      
      queueService.findQueuePath(queueId).then((path) => {
          if (!path) {
              callback(null, "Queue not found");
              return;
          }
          const { businessId, locationId } = path;
          const basePath = `businesses/${businessId}/locations/${locationId}/queues/${queueId}`;

          const visitorsRef = ref(firebaseService.db!, `${basePath}/visitors`);
          unsubVisitors = onValue(visitorsRef, (snapshot: any) => {
              const visitors = snapshotToArray(snapshot) as Visitor[];
              
              const sorted = visitors.sort((a: Visitor, b: Visitor) => {
                  if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                  if (a.isPriority && !b.isPriority) return -1;
                  if (!a.isPriority && b.isPriority) return 1;
                  return a.ticketNumber - b.ticketNumber;
              });

              const waiting = sorted.filter((v: Visitor) => v.status === 'waiting').length;
              const served = sorted.filter((v: Visitor) => v.status === 'served').length;
              const rated = sorted.filter((v: Visitor) => v.rating && v.rating > 0);
              const avgRating = rated.length ? (rated.reduce((a: number, b: Visitor) => a + (b.rating || 0), 0) / rated.length) : 0;
              
              const lastCalled = sorted
                  .filter((v: Visitor) => v.status === 'serving' || v.status === 'served')
                  .sort((a: Visitor, b: Visitor) => b.ticketNumber - a.ticketNumber)[0]?.ticketNumber || 0;

              const baseData = {
                  queueId,
                  currentTicket: lastCalled,
                  lastCalledNumber: lastCalled,
                  metrics: {
                      waiting,
                      served,
                      avgWaitTime: path.queue.estimatedWaitTime || 5,
                      averageRating: parseFloat(avgRating.toFixed(1))
                  },
                  visitors: sorted,
              };

              if (!includeLogs) {
                  callback({ ...baseData, recentActivity: [] });
                  return;
              }

              // Helper to process logs
              const processLogs = (lSnap: any) => {
                  const logsRaw = snapshotToArray(lSnap) as any[];
                  const logs = logsRaw
                      .sort((a,b) => b.timestamp - a.timestamp) // Sort in JS since DB index might be missing
                      .slice(0, 20)
                      .map(l => ({
                          ...l,
                          time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''
                      }));

                  callback({ ...baseData, recentActivity: logs });
              };

              // Try fetching sorted logs first
              const logsQuery = query(ref(firebaseService.db!, `${basePath}/logs`), orderByChild('timestamp'));
              
              get(logsQuery)
                  .then(processLogs)
                  .catch((err: any) => {
                      // If index is missing, fetch ALL logs and sort client-side
                      console.warn("Firebase Index missing for logs. Falling back to client-side sort.", err.message);
                      get(ref(firebaseService.db!, `${basePath}/logs`))
                          .then(processLogs)
                          .catch((e: any) => callback(null, "Failed to load logs"));
                  });
          });
      });

      return () => {
          if (unsubVisitors) unsubVisitors();
      };
  },

  getQueueData: async (queueId: string): Promise<QueueData> => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) throw new Error("Queue not found");
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${queueId}`;
      
      const vSnap = await get(ref(firebaseService.db!, `${basePath}/visitors`));
      const visitors = snapshotToArray(vSnap) as Visitor[];
      
      const waiting = visitors.filter((v: Visitor) => v.status === 'waiting').length;
      const served = visitors.filter((v: Visitor) => v.status === 'served').length;
      const lastCalled = visitors.filter((v: Visitor) => ['serving','served'].includes(v.status))
          .sort((a: Visitor, b: Visitor) => b.ticketNumber - a.ticketNumber)[0]?.ticketNumber || 0;

      return {
          queueId,
          currentTicket: lastCalled,
          lastCalledNumber: lastCalled,
          metrics: { waiting, served, avgWaitTime: path.queue.estimatedWaitTime || 5, averageRating: 0 },
          visitors,
          recentActivity: []
      };
  },

  // --- ACTIONS ---

  joinQueue: async (queueId: string, name: string, phoneNumber?: string, source: 'manual'|'qr' = 'qr') => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) throw new Error("Queue not found");
      const { businessId, locationId } = path;
      const queueRefStr = `businesses/${businessId}/locations/${locationId}/queues/${queueId}`;
      
      // 1. Check for duplicates if phoneNumber is provided
      if (phoneNumber) {
          const visitorsSnap = await get(ref(firebaseService.db!, `${queueRefStr}/visitors`));
          const existingVisitors = snapshotToArray(visitorsSnap) as Visitor[];
          
          const duplicate = existingVisitors.find(v => 
              v.phoneNumber === phoneNumber && v.status === 'waiting'
          );

          if (duplicate) {
              return { visitor: duplicate, queueData: null, isDuplicate: true };
          }
      }

      // 2. Get current sequence and increment
      const qSnap = await get(ref(firebaseService.db!, queueRefStr));
      let currentSeq = qSnap.val().currentTicketSequence || 0;
      currentSeq++;
      
      await update(ref(firebaseService.db!, queueRefStr), { currentTicketSequence: currentSeq });
      
      // 3. Create new visitor
      const visitorsRef = ref(firebaseService.db!, `${queueRefStr}/visitors`);
      const newVisitorRef = push(visitorsRef);
      const newVisitorId = newVisitorRef.key!;

      const visitorData: Visitor = {
          id: newVisitorId,
          ticketNumber: currentSeq,
          name: name || `Guest ${currentSeq}`,
          phoneNumber: phoneNumber || '',
          joinTime: new Date().toISOString(),
          status: 'waiting',
          source,
          isPriority: false,
          order: currentSeq,
          isLate: false
      };

      await set(newVisitorRef, visitorData);
      
      await push(ref(firebaseService.db!, `${queueRefStr}/logs`), {
          timestamp: Date.now(),
          action: 'join',
          ticket: currentSeq,
          user: 'System'
      });

      return { visitor: visitorData, queueData: null };
  },

  updateVisitorStatus: async (queueId: string, visitorId: string, updates: Partial<Visitor>, logAction?: string, user?: string) => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) return;
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${queueId}`;
      
      const vRef = ref(firebaseService.db!, `${basePath}/visitors/${visitorId}`);
      await update(vRef, updates);

      if (logAction) {
          const vSnap = await get(vRef);
          const ticket = vSnap.val()?.ticketNumber || 0;
          await push(ref(firebaseService.db!, `${basePath}/logs`), {
              timestamp: Date.now(),
              action: logAction,
              ticket,
              user: user || 'Staff'
          });
      }
  },

  callNext: async (queueId: string, counterName: string) => {
      const data = await queueService.getQueueData(queueId);
      
      const current = data.visitors.find(v => v.status === 'serving' && (!v.servedBy || v.servedBy === counterName));
      if (current) {
          await queueService.updateVisitorStatus(queueId, current.id, {
              status: 'served',
              servedTime: new Date().toISOString(),
              isAlerting: false,
              calledAt: ''
          }, 'complete', counterName);
      }
      
      const next = data.visitors
          .filter(v => v.status === 'waiting')
          .sort((a,b) => {
              const orderA = a.order ?? 999999;
              const orderB = b.order ?? 999999;
              if (orderA !== orderB) return orderA - orderB;
              if (a.isPriority && !b.isPriority) return -1;
              if (!a.isPriority && b.isPriority) return 1;
              return a.ticketNumber - b.ticketNumber;
          })[0];
      
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

  leaveQueue: (qid: string, vid: string) => queueService.updateVisitorStatus(qid, vid, { status: 'cancelled' }, 'leave'),
  confirmPresence: (qid: string, vid: string) => queueService.updateVisitorStatus(qid, vid, { isAlerting: false, calledAt: '' }),
  triggerAlert: (qid: string, vid: string) => queueService.updateVisitorStatus(qid, vid, { isAlerting: true, calledAt: new Date().toISOString() }),
  
  takeBack: async (qid: string, counter: string) => {
      const data = await queueService.getQueueData(qid);
      const current = data.visitors.find(v => v.status === 'serving' && v.servedBy === counter);
      if (current) queueService.updateVisitorStatus(qid, current.id, { status: 'waiting', isAlerting: false, servedBy: undefined });
  },
  
  submitFeedback: (qid: string, vid: string, rating: number) => queueService.updateVisitorStatus(qid, vid, { rating }),
  
  deleteQueue: async (uid: string, qid: string) => {
      const path = await queueService.findQueuePath(qid);
      if(path) {
          await remove(ref(firebaseService.db!, `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`));
          await remove(ref(firebaseService.db!, `queue_lookup/${qid}`));
      }
  },

  // HYDRATION REMOVED: No more demo mode
  hydrateQueue: async (qid: string, name: string, location?: string) => {
      // Intentionally empty or throw error to force real usage
      console.log("Hydration is disabled in Production Mode.");
  },
  
  getDefaultFeatures: (t: any) => ({ vip: false, multiCounter: false, anonymousMode: false, sms: false }),
  
  updateQueue: async (uid: string, qid: string, data: any) => {
      const path = await queueService.findQueuePath(qid);
      if(path) {
          await update(ref(firebaseService.db!, `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`), data);
          return { ...path.queue, ...data };
      }
      return null;
  },
  
  handleGracePeriodExpiry: async (qid: string, minutes: number) => {}, 
  autoSkipInactive: async (qid: string, minutes: number) => {},
  
  exportStatsCSV: async (queueId: string, queueName: string) => {
      const data = await queueService.getQueueData(queueId);
      const headers = "Ticket,Name,JoinTime,Status,ServedBy,Rating\n";
      const rows = data.visitors.map(v => 
          `${v.ticketNumber},"${v.name}",${v.joinTime},${v.status},${v.servedBy || ''},${v.rating || ''}`
      ).join("\n");
      
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${queueName}_Stats.csv`;
      a.click();
  },
  exportUserData: () => {},
  importUserData: async () => true,
  
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
      const data = await queueService.getQueueData(qid);
      const updates: any = {};
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}/visitors`;
      
      data.visitors.filter(v => v.status === 'waiting').forEach(v => {
          updates[`${basePath}/${v.id}/status`] = 'cancelled';
      });
      
      if (Object.keys(updates).length > 0) {
          await update(ref(firebaseService.db!), updates);
      }
  },
  
  reorderQueue: async (qid: string, visitors: Visitor[]) => {
      const path = await queueService.findQueuePath(qid);
      if(!path) return;
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}/visitors`;
      const updates: any = {};
      
      visitors.forEach((v, idx) => {
          updates[`${basePath}/${v.id}/order`] = idx + 1;
      });
      await update(ref(firebaseService.db!), updates);
  },
  
  getSystemLogs: async () => []
};
