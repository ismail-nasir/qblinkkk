
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
      
      // Initialize Metrics Node for high scalability
      await set(ref(firebaseService.db, `businesses/${businessId}/locations/${locationId}/queues/${id}/metrics_counter`), {
          waiting: 0,
          served: 0,
          cancelled: 0,
          total_service_time: 0,
          service_count: 0
      });

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

  // --- REAL-TIME DATA (SCALABLE IMPLEMENTATION) ---

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

          // 1. Listen to Metrics Counter (Lightweight)
          const metricsRef = ref(firebaseService.db!, `${basePath}/metrics_counter`);
          
          // 2. Listen ONLY to Active Visitors (Waiting & Serving)
          // To scale to 70k, we CANNOT download the whole list.
          const visitorsRef = ref(firebaseService.db!, `${basePath}/visitors`);
          const activeQuery = query(visitorsRef, orderByChild('status'), equalTo('waiting'));
          const servingQuery = query(visitorsRef, orderByChild('status'), equalTo('serving'));

          let waitingVisitors: Visitor[] = [];
          let servingVisitors: Visitor[] = [];
          let currentMetrics: any = { waiting: 0, served: 0, avgWaitTime: path.queue.estimatedWaitTime || 5 };

          const debouncedUpdate = () => {
              const allActive = [...servingVisitors, ...waitingVisitors];
              
              // Sort active list
              allActive.sort((a, b) => {
                  if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                  if (a.isPriority && !b.isPriority) return -1;
                  if (!a.isPriority && b.isPriority) return 1;
                  return a.ticketNumber - b.ticketNumber;
              });

              // Calc Avg Wait from cumulative metrics
              const calculatedAvg = currentMetrics.service_count > 0 
                  ? Math.round((currentMetrics.total_service_time / currentMetrics.service_count) / 60000) 
                  : (path.queue.estimatedWaitTime || 5);

              const lastCalled = servingVisitors.length > 0 
                  ? servingVisitors.sort((a,b) => b.ticketNumber - a.ticketNumber)[0].ticketNumber 
                  : 0;

              const baseData: QueueData = {
                  queueId,
                  currentTicket: lastCalled,
                  lastCalledNumber: lastCalled,
                  metrics: {
                      waiting: waitingVisitors.length, // Trust actual list count for waiting
                      served: currentMetrics.served || 0,
                      avgWaitTime: calculatedAvg || 5,
                      averageRating: 0 // Fetch separately if needed to save BW
                  },
                  visitors: allActive,
                  recentActivity: []
              };

              if (includeLogs) {
                   // Fetch Logs separately (Limit 20)
                   const logsRef = query(ref(firebaseService.db!, `${basePath}/logs`), orderByChild('timestamp'), limitToLast(20));
                   get(logsRef).then((lSnap) => {
                       const logsRaw = snapshotToArray(lSnap) as any[];
                       baseData.recentActivity = logsRaw
                           .sort((a,b) => b.timestamp - a.timestamp)
                           .map(l => ({
                               ...l,
                               time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''
                           }));
                       callback(baseData);
                   });
              } else {
                  callback(baseData);
              }
          };

          const unsubMetrics = onValue(metricsRef, (snap) => {
              if (snap.exists()) currentMetrics = snap.val();
              debouncedUpdate();
          });

          const unsubWaiting = onValue(activeQuery, (snap) => {
              waitingVisitors = snapshotToArray(snap) as Visitor[];
              debouncedUpdate();
          });

          const unsubServing = onValue(servingQuery, (snap) => {
              servingVisitors = snapshotToArray(snap) as Visitor[];
              debouncedUpdate();
          });

          // Store cleanup function
          (callback as any)._unsub = () => {
              unsubMetrics();
              unsubWaiting();
              unsubServing();
          };
      });

      return () => {
          if ((callback as any)._unsub) (callback as any)._unsub();
      };
  },

  getQueueData: async (queueId: string): Promise<QueueData> => {
      return new Promise((resolve, reject) => {
          // Re-use stream logic for a single fetch to ensure consistency
          const unsub = queueService.streamQueueData(queueId, (data, err) => {
              if (data) {
                  // @ts-ignore
                  if(unsub) unsub(); 
                  resolve(data);
              }
              if (err) reject(new Error(err));
          }, true);
      });
  },

  // --- ACTIONS WITH ATOMIC COUNTERS ---

  joinQueue: async (queueId: string, name: string, phoneNumber?: string, source: 'manual'|'qr' = 'qr') => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) throw new Error("Queue not found");
      const { businessId, locationId } = path;
      const basePath = `businesses/${businessId}/locations/${locationId}/queues/${queueId}`;
      
      // 1. Duplicate Check
      if (phoneNumber) {
          const visitorsRef = ref(firebaseService.db!, `${basePath}/visitors`);
          const dupQuery = query(visitorsRef, orderByChild('phoneNumber'), equalTo(phoneNumber));
          const dupSnap = await get(dupQuery);
          
          if (dupSnap.exists()) {
              // Client-side filter for waiting status on the small result set
              const duplicates = snapshotToArray(dupSnap) as Visitor[];
              const activeDup = duplicates.find(v => v.status === 'waiting');
              if (activeDup) return { visitor: activeDup, queueData: null, isDuplicate: true };
          }
      }

      // 2. Atomic Increment Ticket Sequence
      const queueRef = ref(firebaseService.db!, basePath);
      const seqResult = await runTransaction(ref(firebaseService.db!, `${basePath}/currentTicketSequence`), (currentSeq) => {
          return (currentSeq || 0) + 1;
      });
      const currentSeq = seqResult.snapshot.val();

      // 3. Create Visitor
      const newVisitorRef = push(ref(firebaseService.db!, `${basePath}/visitors`));
      const visitorData: Visitor = {
          id: newVisitorRef.key!,
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
      
      // 4. Update Metrics Counter Atomically
      await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter/waiting`), (count) => (count || 0) + 1);

      // 5. Log
      await push(ref(firebaseService.db!, `${basePath}/logs`), {
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
      
      // Get current status to handle counter logic
      const vRef = ref(firebaseService.db!, `${basePath}/visitors/${visitorId}`);
      const vSnap = await get(vRef);
      if (!vSnap.exists()) return;
      const currentVisitor = vSnap.val() as Visitor;

      await update(vRef, updates);

      // Handle Metrics Counters
      const metricsRef = ref(firebaseService.db!, `${basePath}/metrics_counter`);
      
      if (logAction === 'complete' && currentVisitor.status === 'serving') {
          // Moving Serving -> Served
          await runTransaction(metricsRef, (metrics) => {
              if (!metrics) metrics = { served: 0, service_count: 0, total_service_time: 0 };
              metrics.served = (metrics.served || 0) + 1;
              
              if (currentVisitor.servingStartTime) {
                  const duration = Date.now() - new Date(currentVisitor.servingStartTime).getTime();
                  metrics.total_service_time = (metrics.total_service_time || 0) + duration;
                  metrics.service_count = (metrics.service_count || 0) + 1;
              }
              return metrics;
          });
      } else if (logAction === 'call' && currentVisitor.status === 'waiting') {
          // Moving Waiting -> Serving
          await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter/waiting`), (c) => Math.max(0, (c || 0) - 1));
      } else if ((logAction === 'leave' || updates.status === 'cancelled') && currentVisitor.status === 'waiting') {
          // Cancelled from Waiting
          await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter/waiting`), (c) => Math.max(0, (c || 0) - 1));
          await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter/cancelled`), (c) => (c || 0) + 1);
      }

      if (logAction) {
          await push(ref(firebaseService.db!, `${basePath}/logs`), {
              timestamp: Date.now(),
              action: logAction,
              ticket: currentVisitor.ticketNumber,
              user: user || 'Staff'
          });
      }
  },

  // BULK UPDATE ACTION (Optimized)
  bulkUpdateVisitorStatus: async (queueId: string, visitorIds: string[], status: 'served' | 'skipped' | 'cancelled') => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) return;
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${queueId}`;
      
      const updates: any = {};
      const now = new Date().toISOString();

      // We need to decrement waiting count by length of array
      // NOTE: This assumes all selected were 'waiting'. UI should enforce this.
      const count = visitorIds.length;

      visitorIds.forEach(id => {
          updates[`${basePath}/visitors/${id}/status`] = status;
          if (status === 'served') {
              updates[`${basePath}/visitors/${id}/servedTime`] = now;
              updates[`${basePath}/visitors/${id}/isAlerting`] = false;
          }
      });

      // Update counters
      if (status === 'served') {
          await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter`), (metrics) => {
              if(!metrics) metrics = { waiting:0, served:0 };
              metrics.waiting = Math.max(0, (metrics.waiting || 0) - count);
              metrics.served = (metrics.served || 0) + count;
              return metrics;
          });
      } else {
          await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter`), (metrics) => {
              if(!metrics) metrics = { waiting:0, cancelled:0 };
              metrics.waiting = Math.max(0, (metrics.waiting || 0) - count);
              metrics.cancelled = (metrics.cancelled || 0) + count;
              return metrics;
          });
      }

      // Log batch
      const logRef = push(ref(firebaseService.db!, `${basePath}/logs`));
      updates[`${basePath}/logs/${logRef.key}`] = {
          timestamp: Date.now(),
          action: `bulk_${status}`,
          ticket: 0,
          user: 'Staff',
          details: `${count} visitors marked as ${status}`
      };

      await update(ref(firebaseService.db!), updates);
  },

  callNext: async (queueId: string, counterName: string) => {
      // 1. Get ONLY necessary data (Active visitors)
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
      
      // Re-fetch to be safe or rely on data state (data is slightly stale now, but order usually robust)
      // For atomic safety in high volume, we should use a transaction to 'claim' the next user,
      // but for this MVP architecture, sorting client side is acceptable if the list is up to date.
      
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

  // ... (Other Methods: Leave, Confirm, Alert - wrapper around updateVisitorStatus) ...
  leaveQueue: (qid: string, vid: string) => queueService.updateVisitorStatus(qid, vid, { status: 'cancelled' }, 'leave'),
  confirmPresence: (qid: string, vid: string) => queueService.updateVisitorStatus(qid, vid, { isAlerting: false, calledAt: '' }),
  triggerAlert: (qid: string, vid: string) => queueService.updateVisitorStatus(qid, vid, { isAlerting: true, calledAt: new Date().toISOString() }),
  
  takeBack: async (qid: string, counter: string) => {
      const data = await queueService.getQueueData(qid);
      const current = data.visitors.find(v => v.status === 'serving' && v.servedBy === counter);
      if (current) {
          // Manually handle counter update for 'take back' (Serving -> Waiting)
          const path = await queueService.findQueuePath(qid);
          if (path) {
              const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`;
              await update(ref(firebaseService.db!, `${basePath}/visitors/${current.id}`), { status: 'waiting', isAlerting: false, servedBy: undefined });
              await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter/waiting`), (c) => (c || 0) + 1);
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

  hydrateQueue: async (qid: string, name: string, location?: string) => {
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
  exportUserData: () => {},
  importUserData: async () => true,
  
  callByNumber: async (qid: string, num: number, counter: string) => {
      // Optimized call by number
      const path = await queueService.findQueuePath(qid);
      if (!path) return;
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`;
      
      const q = query(ref(firebaseService.db!, `${basePath}/visitors`), orderByChild('ticketNumber'), equalTo(num));
      const snap = await get(q);
      
      if (snap.exists()) {
          const visitors = snapshotToArray(snap) as Visitor[];
          // Find the one that matches
          const target = visitors[0]; 
          if(target) {
               await queueService.updateVisitorStatus(qid, target.id, { 
                   status: 'serving', isAlerting: true, servedBy: counter, calledAt: new Date().toISOString() 
               }, 'call', counter);
          }
      }
  },
  
  togglePriority: (qid: string, vid: string, isPriority: boolean) => queueService.updateVisitorStatus(qid, vid, { isPriority }),
  
  clearQueue: async (qid: string) => {
      // Bulk cancel all waiting
      const path = await queueService.findQueuePath(qid);
      if(!path) return;
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`;
      
      // 1. Fetch only waiting
      const q = query(ref(firebaseService.db!, `${basePath}/visitors`), orderByChild('status'), equalTo('waiting'));
      const snap = await get(q);
      
      if (snap.exists()) {
          const updates: any = {};
          const visitors = snapshotToArray(snap) as Visitor[];
          
          visitors.forEach(v => {
              updates[`${basePath}/visitors/${v.id}/status`] = 'cancelled';
          });
          
          if (Object.keys(updates).length > 0) {
              await update(ref(firebaseService.db!), updates);
              // Reset Waiting Counter
              await set(ref(firebaseService.db!, `${basePath}/metrics_counter/waiting`), 0);
              await runTransaction(ref(firebaseService.db!, `${basePath}/metrics_counter/cancelled`), (c) => (c||0) + visitors.length);
          }
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
