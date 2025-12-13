
import { QueueData, QueueInfo, Visitor, QueueFeatures, BusinessType, LocationInfo, ActivityLog } from '../types';
import { 
    firebaseService,
    ref,
    onValue,
    push,
    set,
    update,
    get,
    remove,
    query,
    orderByChild
} from './firebase';

const { db } = firebaseService;

// Helper to convert object snapshot to array
const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (!data) return [];
    return Object.entries(data).map(([key, value]: [string, any]) => ({ id: key, ...value }));
};

export const queueService = {

  // --- LOCATIONS ---

  getLocations: (businessId: string, callback: (locs: LocationInfo[]) => void) => {
      if (!db) return () => {};
      const locationsRef = ref(db, `businesses/${businessId}/locations`);
      
      return onValue(locationsRef, (snapshot) => {
          const locs = snapshotToArray(snapshot);
          // Sort by creation time manually since RTDB sorting is limited
          locs.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
          callback(locs as LocationInfo[]);
      });
  },

  createLocation: async (businessId: string, name: string) => {
      if (!db) throw new Error("Firebase not initialized");
      const locationsRef = ref(db, `businesses/${businessId}/locations`);
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
      if (!db) return () => {};
      const queuesRef = ref(db, `businesses/${businessId}/locations/${locationId}/queues`);
      
      return onValue(queuesRef, (snapshot) => {
          const queues = snapshotToArray(snapshot);
          queues.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
          callback(queues as QueueInfo[]);
      });
  },

  getUserQueues: async (businessId: string): Promise<QueueInfo[]> => {
      if (!db) return [];
      
      // Fetch all locations to aggregate queues (RTDB doesn't have collectionGroup)
      const locsRef = ref(db, `businesses/${businessId}/locations`);
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
      if (!db) throw new Error("Firebase not initialized");
      
      const queuesRef = ref(db, `businesses/${businessId}/locations/${locationId}/queues`);
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
      
      // Create a global lookup index for fast access by queueId
      await set(ref(db, `queue_lookup/${id}`), { businessId, locationId });

      return newQueue;
  },

  // Helper to find where a queue is located in the tree
  findQueuePath: async (queueId: string): Promise<{ businessId: string, locationId: string, queue: QueueInfo } | null> => {
      if (!db) return null;
      
      const lookupRef = ref(db, `queue_lookup/${queueId}`);
      const lookupSnap = await get(lookupRef);
      
      if (!lookupSnap.exists()) return null;
      const { businessId, locationId } = lookupSnap.val();
      
      const queueRef = ref(db, `businesses/${businessId}/locations/${locationId}/queues/${queueId}`);
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

  streamQueueData: (queueId: string, callback: (data: QueueData) => void) => {
      if (!db) return () => {};

      let unsubVisitors: any = null;
      
      // We need to resolve the path first
      queueService.findQueuePath(queueId).then((path) => {
          if (!path) return;
          const { businessId, locationId } = path;
          const basePath = `businesses/${businessId}/locations/${locationId}/queues/${queueId}`;

          const visitorsRef = ref(db, `${basePath}/visitors`);
          unsubVisitors = onValue(visitorsRef, (snapshot) => {
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

              // Fetch logs (separately or nested, using simple fetch here for logs to reduce bandwidth)
              const logsRef = query(ref(db, `${basePath}/logs`), orderByChild('timestamp'));
              get(logsRef).then((lSnap) => {
                  const logsRaw = snapshotToArray(lSnap) as any[];
                  const logs = logsRaw.sort((a,b) => b.timestamp - a.timestamp).slice(0, 20).map(l => ({
                      ...l,
                      time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''
                  }));

                  callback({
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
                      recentActivity: logs
                  });
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
      
      const vSnap = await get(ref(db, `${basePath}/visitors`));
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
      
      // Simple atomic increment via get/update (Transaction preferred but this works for MVP)
      const qSnap = await get(ref(db, queueRefStr));
      let currentSeq = qSnap.val().currentTicketSequence || 0;
      currentSeq++;
      
      await update(ref(db, queueRefStr), { currentTicketSequence: currentSeq });
      
      const visitorsRef = ref(db, `${queueRefStr}/visitors`);
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
      
      // Log it
      await push(ref(db, `${queueRefStr}/logs`), {
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
      
      const vRef = ref(db, `${basePath}/visitors/${visitorId}`);
      await update(vRef, updates);

      if (logAction) {
          const vSnap = await get(vRef);
          const ticket = vSnap.val()?.ticketNumber || 0;
          await push(ref(db, `${basePath}/logs`), {
              timestamp: Date.now(),
              action: logAction,
              ticket,
              user: user || 'Staff'
          });
      }
  },

  callNext: async (queueId: string, counterName: string) => {
      const data = await queueService.getQueueData(queueId);
      
      // 1. Complete current
      const current = data.visitors.find(v => v.status === 'serving' && (!v.servedBy || v.servedBy === counterName));
      if (current) {
          await queueService.updateVisitorStatus(queueId, current.id, {
              status: 'served',
              servedTime: new Date().toISOString(),
              isAlerting: false,
              calledAt: ''
          }, 'complete', counterName);
      }
      
      // 2. Serve next
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
          await remove(ref(db, `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`));
          await remove(ref(db, `queue_lookup/${qid}`));
      }
  },

  hydrateQueue: async (qid: string, name: string, location?: string) => {
      // Create a temporary mock queue in local DB so 'get' works
      // This supports the offline/demo mode without 404
      if (!db) return;
      
      // Auto-generate business/location/queue structure
      const businessId = "demo_business";
      const locationId = "demo_location";
      
      const lookupRef = ref(db, `queue_lookup/${qid}`);
      await set(lookupRef, { businessId, locationId });
      
      const queueRef = ref(db, `businesses/${businessId}/locations/${locationId}/queues/${qid}`);
      const mockQueue: QueueInfo = {
          id: qid,
          businessId,
          locationId,
          name: name || "Demo Queue",
          code: "DEMO",
          status: 'active',
          createdAt: new Date().toISOString(),
          estimatedWaitTime: 5,
          businessType: 'general',
          features: { vip: true, multiCounter: false, anonymousMode: false, sms: false },
          settings: { 
              soundEnabled: true, 
              soundVolume: 1, 
              soundType: 'beep', 
              themeColor: '#3b82f6', 
              gracePeriodMinutes: 2,
              autoSkipMinutes: 0
          },
          location: location || "Demo Location",
          currentTicketSequence: 0
      };
      await set(queueRef, mockQueue);
  },
  
  getDefaultFeatures: (t: any) => ({ vip: false, multiCounter: false, anonymousMode: false, sms: false }),
  
  updateQueue: async (uid: string, qid: string, data: any) => {
      const path = await queueService.findQueuePath(qid);
      if(path) {
          await update(ref(db, `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`), data);
          return { ...path.queue, ...data };
      }
      return null;
  },
  
  handleGracePeriodExpiry: async (qid: string, minutes: number) => {
      // Background check logic would go here
  }, 
  autoSkipInactive: async (qid: string, minutes: number) => {},
  exportStatsCSV: async () => {},
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
          await update(ref(db), updates);
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
      await update(ref(db), updates);
  },
  
  getSystemLogs: async () => []
};
