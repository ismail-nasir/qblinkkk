
import { QueueData, QueueInfo, Visitor, QueueFeatures, BusinessType, LocationInfo, ActivityLog } from '../types';
import { firebaseService } from './firebase';

const { db } = firebaseService;

export const queueService = {

  // --- LOCATIONS ---

  getLocations: (businessId: string, callback: (locs: LocationInfo[]) => void) => {
      if (!db) return () => {};
      return db.collection(`businesses/${businessId}/locations`)
          .orderBy('createdAt', 'asc')
          .onSnapshot((snapshot: any) => {
              const locs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as LocationInfo));
              callback(locs);
          });
  },

  createLocation: async (businessId: string, name: string) => {
      if (!db) throw new Error("No DB");
      const ref = db.collection(`businesses/${businessId}/locations`).doc();
      await ref.set({ 
          id: ref.id, 
          name, 
          createdAt: firebaseService.serverTimestamp() 
      });
      return { id: ref.id, name };
  },

  // --- QUEUES ---

  getLocationQueues: (businessId: string, locationId: string, callback: (queues: QueueInfo[]) => void) => {
      if (!db) return () => {};
      return db.collection(`businesses/${businessId}/locations/${locationId}/queues`)
          .orderBy('createdAt', 'desc')
          .onSnapshot((snapshot: any) => {
              const queues = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as QueueInfo));
              callback(queues);
          });
  },

  getUserQueues: async (businessId: string): Promise<QueueInfo[]> => {
      if (!db) return [];
      const snapshot = await db.collectionGroup('queues').where('businessId', '==', businessId).get();
      return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as QueueInfo));
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
      
      const newQueueRef = db.collection(`businesses/${businessId}/locations/${locationId}/queues`).doc();
      
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

      await newQueueRef.set(newQueue);
      return newQueue;
  },

  findQueuePath: async (queueId: string): Promise<{ businessId: string, locationId: string, queue: QueueInfo } | null> => {
      if (!db) return null;
      const snapshot = await db.collectionGroup('queues').where('id', '==', queueId).limit(1).get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      const data = doc.data() as QueueInfo;
      const pathSegments = doc.ref.path.split('/');
      // Path: businesses/{bid}/locations/{lid}/queues/{qid}
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

  // --- REAL-TIME QUEUE DATA ---

  streamQueueData: (queueId: string, callback: (data: QueueData) => void) => {
      if (!db) return () => {};

      let unsubVisitors: () => void;
      let unsubLogs: () => void;

      queueService.findQueuePath(queueId).then((path) => {
          if (!path) return;
          const { businessId, locationId } = path;
          const basePath = `businesses/${businessId}/locations/${locationId}/queues/${queueId}`;

          unsubVisitors = db.collection(`${basePath}/visitors`).onSnapshot((vSnap: any) => {
              const visitors = vSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Visitor));
              
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

              unsubLogs = db.collection(`${basePath}/logs`).orderBy('timestamp', 'desc').limit(20).onSnapshot((lSnap: any) => {
                  const logs = lSnap.docs.map((d: any) => ({ 
                      id: d.id, ...d.data(), 
                      time: d.data().timestamp?.toDate ? d.data().timestamp.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '' 
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
      
      const vSnap = await db.collection(`${basePath}/visitors`).get();
      const visitors = vSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Visitor));
      
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
      const queueRef = db.doc(`businesses/${businessId}/locations/${locationId}/queues/${queueId}`);
      
      let ticketNumber = 1;
      let newVisitorId = '';

      await db.runTransaction(async (transaction: any) => {
          const qDoc = await transaction.get(queueRef);
          if (!qDoc.exists) throw new Error("Queue missing");
          
          const currentSeq = qDoc.data().currentTicketSequence || 0;
          ticketNumber = currentSeq + 1;
          
          transaction.update(queueRef, { currentTicketSequence: ticketNumber });
          
          const newVisitorRef = queueRef.collection('visitors').doc();
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
          
          const logRef = queueRef.collection('logs').doc();
          transaction.set(logRef, {
              timestamp: firebaseService.serverTimestamp(),
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
      
      const vRef = db.doc(`${basePath}/visitors/${visitorId}`);
      await vRef.update(updates);

      if (logAction) {
          const vSnap = await vRef.get();
          const ticket = vSnap.data()?.ticketNumber || 0;
          await db.collection(`${basePath}/logs`).add({
              timestamp: firebaseService.serverTimestamp(),
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
          });
      }
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
          await db.doc(`businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`).delete();
      }
  },

  hydrateQueue: async (qid: string, name: string, location?: string) => {},
  
  getDefaultFeatures: (t: any) => ({ vip: false, multiCounter: false, anonymousMode: false, sms: false }),
  
  updateQueue: async (uid: string, qid: string, data: any) => {
      const path = await queueService.findQueuePath(qid);
      if(path) {
          await db.doc(`businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`).update(data);
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
      const snapshot = await db.collection(`businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}/visitors`).where('status', '==', 'waiting').get();
      const batch = db.batch();
      snapshot.docs.forEach((doc: any) => {
          batch.update(doc.ref, { status: 'cancelled' });
      });
      await batch.commit();
  },
  
  reorderQueue: async (qid: string, visitors: Visitor[]) => {
      const path = await queueService.findQueuePath(qid);
      if(!path) return;
      const batch = db.batch();
      const basePath = `businesses/${path.businessId}/locations/${path.locationId}/queues/${qid}`;
      visitors.forEach((v, idx) => {
          const ref = db.doc(`${basePath}/visitors/${v.id}`);
          batch.update(ref, { order: idx + 1 });
      });
      await batch.commit();
  },
  
  getSystemLogs: async () => []
};
