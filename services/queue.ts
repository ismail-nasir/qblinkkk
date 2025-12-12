
import { QueueData, QueueInfo, Visitor, QueueFeatures, BusinessType, LocationInfo, ActivityLog } from '../types';
import { firebaseService } from './firebase';
import { 
    collection, doc, addDoc, setDoc, updateDoc, deleteDoc, 
    getDocs, getDoc, query, where, orderBy, limit, onSnapshot,
    serverTimestamp, increment, runTransaction, collectionGroup
} from 'firebase/firestore';

const { db } = firebaseService;

export const queueService = {

  // --- LOCATIONS ---

  getLocations: (businessId: string, callback: (locs: LocationInfo[]) => void) => {
      if (!db) return () => {};
      const q = query(collection(db, `businesses/${businessId}/locations`));
      return onSnapshot(q, (snapshot) => {
          const locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LocationInfo));
          callback(locs);
      });
  },

  createLocation: async (businessId: string, name: string) => {
      if (!db) throw new Error("No DB");
      const ref = doc(collection(db, `businesses/${businessId}/locations`));
      await setDoc(ref, { id: ref.id, name, createdAt: serverTimestamp() });
      return { id: ref.id, name };
  },

  // --- QUEUES ---

  // Real-time listener for queues in a location
  getLocationQueues: (businessId: string, locationId: string, callback: (queues: QueueInfo[]) => void) => {
      if (!db) return () => {};
      const q = query(
          collection(db, `businesses/${businessId}/locations/${locationId}/queues`),
          orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
          const queues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueInfo));
          callback(queues);
      });
  },

  createQueue: async (
      businessId: string, 
      name: string, 
      wait: number, 
      type: BusinessType, 
      features: QueueFeatures, 
      locationId: string
  ) => {
      if (!db) throw new Error("No DB");
      
      const newQueueRef = doc(collection(db, `businesses/${businessId}/locations/${locationId}/queues`));
      
      const newQueue: QueueInfo = {
          id: newQueueRef.id,
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
              gracePeriodMinutes: 2 
          },
          isPaused: false,
          announcement: '',
          currentTicketSequence: 0
      };

      await setDoc(newQueueRef, newQueue);
      return newQueue;
  },

  // Resolves the full path of a queue from its ID using Collection Group Query
  findQueuePath: async (queueId: string): Promise<{ businessId: string, locationId: string, queue: QueueInfo } | null> => {
      if (!db) return null;
      // Find the queue document anywhere in the database
      const q = query(collectionGroup(db, 'queues'), where('id', '==', queueId), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      const data = doc.data() as QueueInfo;
      
      // Parse hierarchy from path: businesses/{bid}/locations/{lid}/queues/{qid}
      const pathSegments = doc.ref.path.split('/');
      return {
          businessId: pathSegments[1],
          locationId: pathSegments[3],
          queue: data
      };
  },

  getQueueInfo: async (queueId: string): Promise<QueueInfo | null> => {
      const result = await queueService.findQueuePath(queueId);
      return result ? result.queue : null;
  },

  // --- REAL-TIME QUEUE DATA STREAM ---

  streamQueueData: (queueId: string, callback: (data: QueueData) => void) => {
      if (!db) return () => {};

      let unsubVisitors: () => void;
      let unsubLogs: () => void;
      
      // Async setup wrapped in promise handling handled internally or by component
      queueService.findQueuePath(queueId).then((path) => {
          if (!path) return;
          const { businessId, locationId } = path;
          const basePath = `businesses/${businessId}/locations/${locationId}/queues/${queueId}`;

          const qVisitors = query(collection(db, `${basePath}/visitors`));
          const qLogs = query(collection(db, `${basePath}/logs`), orderBy('timestamp', 'desc'), limit(50));

          unsubVisitors = onSnapshot(qVisitors, (vSnap) => {
              const visitors = vSnap.docs.map(d => ({ id: d.id, ...d.data() } as Visitor));
              
              const sorted = visitors.sort((a,b) => {
                  if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                  if (a.isPriority && !b.isPriority) return -1;
                  if (!a.isPriority && b.isPriority) return 1;
                  return a.ticketNumber - b.ticketNumber;
              });

              const waiting = sorted.filter(v => v.status === 'waiting').length;
              const served = sorted.filter(v => v.status === 'served').length;
              const rated = sorted.filter(v => v.rating && v.rating > 0);
              const avgRating = rated.length ? (rated.reduce((a, b) => a + (b.rating || 0), 0) / rated.length) : 0;
              
              const lastCalled = sorted
                  .filter(v => v.status === 'serving' || v.status === 'served')
                  .sort((a,b) => b.ticketNumber - a.ticketNumber)[0]?.ticketNumber || 0;

              // Nested listener for logs to ensure sync
              onSnapshot(qLogs, (lSnap) => {
                  const logs = lSnap.docs.map(d => ({ 
                      id: d.id, ...d.data(), 
                      time: d.data().timestamp?.toDate ? d.data().timestamp.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString() 
                  } as ActivityLog));

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
          if (unsubLogs) unsubLogs();
      };
  },

  getQueueData: async (queueId: string): Promise<QueueData> => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) throw new Error("Queue not found");
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${queueId}`;
      
      const vSnap = await getDocs(collection(db, `${basePath}/visitors`));
      const visitors = vSnap.docs.map(d => ({ id: d.id, ...d.data() } as Visitor));
      
      const waiting = visitors.filter(v => v.status === 'waiting').length;
      const served = visitors.filter(v => v.status === 'served').length;
      const lastCalled = visitors.filter(v => ['serving','served'].includes(v.status))
          .sort((a,b) => b.ticketNumber - a.ticketNumber)[0]?.ticketNumber || 0;

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
      const queueRef = doc(db, `businesses/${businessId}/locations/${locationId}/queues/${queueId}`);
      
      let ticketNumber = 1;
      let newVisitorId = '';

      await runTransaction(db, async (transaction) => {
          const qDoc = await transaction.get(queueRef);
          if (!qDoc.exists()) throw new Error("Queue missing");
          
          const currentSeq = qDoc.data().currentTicketSequence || 0;
          ticketNumber = currentSeq + 1;
          
          transaction.update(queueRef, { currentTicketSequence: ticketNumber });
          
          const newVisitorRef = doc(collection(db, `${queueRef.path}/visitors`));
          newVisitorId = newVisitorRef.id;

          const visitorData: Visitor = {
              id: newVisitorId,
              ticketNumber,
              name: name || `Guest ${ticketNumber}`,
              phoneNumber: phoneNumber || '',
              joinTime: new Date().toISOString(),
              status: 'waiting',
              source,
              isPriority: false,
              order: ticketNumber,
              isLate: false
          };

          transaction.set(newVisitorRef, visitorData);
          
          const logRef = doc(collection(db, `${queueRef.path}/logs`));
          transaction.set(logRef, {
              timestamp: serverTimestamp(),
              action: 'join',
              ticket: ticketNumber,
              user: 'System'
          });
      });

      return { visitor: { id: newVisitorId, ticketNumber } as Visitor, queueData: null };
  },

  updateVisitorStatus: async (queueId: string, visitorId: string, updates: Partial<Visitor>, logAction?: string, user?: string) => {
      const path = await queueService.findQueuePath(queueId);
      if (!path) return;
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${queueId}`;
      
      const vRef = doc(db, `${basePath}/visitors/${visitorId}`);
      await updateDoc(vRef, updates);

      if (logAction) {
          const vSnap = await getDoc(vRef);
          const ticket = vSnap.data()?.ticketNumber || 0;
          await addDoc(collection(db, `${basePath}/logs`), {
              timestamp: serverTimestamp(),
              action: logAction,
              ticket,
              user: user || 'Staff'
          });
      }
  },

  callNext: async (queueId: string, counterName: string) => {
      const data = await queueService.getQueueData(queueId);
      
      // 1. Finish current
      const current = data.visitors.find(v => v.status === 'serving' && (!v.servedBy || v.servedBy === counterName));
      if (current) {
          await queueService.updateVisitorStatus(queueId, current.id, {
              status: 'served',
              servedTime: new Date().toISOString(),
              isAlerting: false,
              calledAt: ''
          });
      }

      // 2. Call Next
      const next = data.visitors
          .filter(v => v.status === 'waiting')
          .sort((a,b) => (a.order || 0) - (b.order || 0))[0];
      
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

  // Helpers
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
          await deleteDoc(doc(db, `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`));
      }
  },
  
  getUserQueues: async (uid: string) => {
      // Helper to fetch all queues across all locations for a user (Expensive read, better to use location-specific)
      // For dashboard summary
      const q = query(collectionGroup(db, 'queues'), where('businessId', '==', uid));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({id: d.id, ...d.data()} as QueueInfo));
  },

  getDefaultFeatures: (t: any) => ({ vip: false, multiCounter: false, anonymousMode: false, sms: false }),
  hydrateQueue: async () => null,
  updateQueue: async (uid: string, qid: string, data: any) => {
      const path = await queueService.findQueuePath(qid);
      if(path) {
          await updateDoc(doc(db, `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`), data);
      }
      return null;
  },
  handleGracePeriodExpiry: async (qid: string, mins: number) => {}, 
  autoSkipInactive: async () => {},
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
      const q = query(collection(db, `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}/visitors`), where('status', '==', 'waiting'));
      const snap = await getDocs(q);
      snap.forEach(d => updateDoc(d.ref, { status: 'cancelled' }));
  },
  reorderQueue: async (qid: string, visitors: Visitor[]) => {
      visitors.forEach((v, idx) => {
          queueService.updateVisitorStatus(qid, v.id, { order: idx + 1 });
      });
  },
  getSystemLogs: async () => []
};
