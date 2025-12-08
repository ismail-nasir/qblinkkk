


import { QueueData, QueueMetric, ActivityLog, User, Visitor, QueueInfo } from '../types';

const DATA_KEY_PREFIX = 'qblink_data_';
const QUEUES_KEY_PREFIX = 'qblink_queues_';

const generateShortCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const INITIAL_DATA: Omit<QueueData, 'queueId'> = {
  currentTicket: 0,
  lastCalledNumber: 0,
  metrics: {
    waiting: 0,
    served: 0,
    avgWaitTime: 5
  },
  recentActivity: [],
  visitors: []
};

// Helper to get queue data key
const getDataKey = (queueId: string) => `${DATA_KEY_PREFIX}${queueId}`;
// Helper to get user queues key
const getUserQueuesKey = (userId: string) => `${QUEUES_KEY_PREFIX}${userId}`;

export const queueService = {
  // --- Queue Management (Multi-Queue) ---

  // Get all queues for a user
  getUserQueues: (userId: string): QueueInfo[] => {
    const key = getUserQueuesKey(userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  // Create a new queue
  createQueue: (userId: string, name: string, estimatedWaitTime?: number): QueueInfo => {
    const queues = queueService.getUserQueues(userId);
    
    const newQueue: QueueInfo = {
      id: crypto.randomUUID(),
      userId,
      name,
      code: generateShortCode(),
      status: 'active',
      createdAt: new Date().toISOString(),
      estimatedWaitTime: estimatedWaitTime || undefined
    };

    queues.push(newQueue);
    localStorage.setItem(getUserQueuesKey(userId), JSON.stringify(queues));
    
    // Initialize Data for this queue
    const initialQueueData: QueueData = {
        ...INITIAL_DATA,
        queueId: newQueue.id,
        metrics: {
            ...INITIAL_DATA.metrics,
            avgWaitTime: estimatedWaitTime || 5 // Use manual estimate if provided
        }
    };
    localStorage.setItem(getDataKey(newQueue.id), JSON.stringify(initialQueueData));

    return newQueue;
  },

  // Delete a queue
  deleteQueue: (userId: string, queueId: string) => {
      const queues = queueService.getUserQueues(userId);
      const updatedQueues = queues.filter(q => q.id !== queueId);
      localStorage.setItem(getUserQueuesKey(userId), JSON.stringify(updatedQueues));
      localStorage.removeItem(getDataKey(queueId));
  },

  // Get metadata for a specific queue by ID (useful for public views)
  getQueueInfo: (queueId: string): QueueInfo | null => {
      // In a real DB, we'd query by ID. 
      // In localStorage, we have to iterate all users or store a global map.
      // For this demo, we assume we might not need the owner info immediately, 
      // OR we scan keys. Scanning keys is safer for this 'database'.
      
      // Optimization: We can store a global map of queueId -> userId, 
      // but let's just search since it's local.
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(QUEUES_KEY_PREFIX)) {
              const queues: QueueInfo[] = JSON.parse(localStorage.getItem(key) || '[]');
              const found = queues.find(q => q.id === queueId);
              if (found) return found;
          }
      }
      return null;
  },


  // --- Data Operations (Specific to a Queue ID) ---

  // Get data for a specific queue
  getQueueData: (queueId: string): QueueData => {
    const dataStr = localStorage.getItem(getDataKey(queueId));
    if (!dataStr) {
      // Fallback for legacy data (if queueId passed was actually userId in old version)
      // or just return empty initial data
      return { ...INITIAL_DATA, queueId };
    }
    try {
      const parsed = JSON.parse(dataStr);
      return { ...INITIAL_DATA, ...parsed, queueId };
    } catch {
      return { ...INITIAL_DATA, queueId };
    }
  },

  saveQueueData: (queueId: string, data: QueueData) => {
    localStorage.setItem(getDataKey(queueId), JSON.stringify(data));
  },

  // Get aggregated system logs (Admin)
  getSystemLogs: (users: User[]): (ActivityLog & { user: string, email: string })[] => {
    let allLogs: (ActivityLog & { user: string, email: string })[] = [];
    
    // Iterate users, then their queues
    users.forEach(user => {
        const queues = queueService.getUserQueues(user.id);
        queues.forEach(queue => {
            const data = queueService.getQueueData(queue.id);
            if (data.recentActivity && data.recentActivity.length > 0) {
                 const labeledLogs = data.recentActivity.map(log => ({
                    ...log,
                    user: `${user.businessName} (${queue.name})`,
                    email: user.email
                }));
                allLogs = [...allLogs, ...labeledLogs];
            }
        });
    });
    return allLogs.reverse(); 
  },

  // --- ACTIONS ---

  // Customer Joins Queue
  joinQueue: (queueId: string, name: string): { visitor: Visitor, queueData: QueueData } => {
    const data = queueService.getQueueData(queueId);
    
    const maxTicket = data.visitors.reduce((max, v) => Math.max(max, v.ticketNumber), data.lastCalledNumber);
    const newTicketNumber = maxTicket + 1;

    const newVisitor: Visitor = {
        id: crypto.randomUUID(),
        ticketNumber: newTicketNumber,
        name: name || `Visitor #${newTicketNumber}`,
        joinTime: new Date().toISOString(),
        status: 'waiting'
    };

    const updatedVisitors = [...data.visitors, newVisitor];
    
    const newMetrics = {
        ...data.metrics,
        waiting: updatedVisitors.filter(v => v.status === 'waiting').length
    };

    const newActivity: ActivityLog = {
        ticket: newTicketNumber,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'join',
        details: name
    };

    const updatedData = {
        ...data,
        visitors: updatedVisitors,
        metrics: newMetrics,
        recentActivity: [newActivity, ...data.recentActivity].slice(0, 50)
    };

    queueService.saveQueueData(queueId, updatedData);
    return { visitor: newVisitor, queueData: updatedData };
  },

  leaveQueue: (queueId: string, visitorId: string) => {
      const data = queueService.getQueueData(queueId);
      const updatedVisitors = data.visitors.map(v => 
          v.id === visitorId ? { ...v, status: 'cancelled' as const } : v
      ).filter(v => v.status !== 'cancelled');

      const visitor = data.visitors.find(v => v.id === visitorId);
      
      const newActivity: ActivityLog = {
          ticket: visitor?.ticketNumber || 0,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'leave'
      };

      const updatedData = {
          ...data,
          visitors: updatedVisitors,
          metrics: { ...data.metrics, waiting: updatedVisitors.filter(v => v.status === 'waiting').length },
          recentActivity: [newActivity, ...data.recentActivity].slice(0, 50)
      };

      queueService.saveQueueData(queueId, updatedData);
      return updatedData;
  },

  callNext: (queueId: string) => {
    const data = queueService.getQueueData(queueId);
    
    const nextVisitor = data.visitors
        .filter(v => v.status === 'waiting')
        .sort((a, b) => a.ticketNumber - b.ticketNumber)[0];

    if (!nextVisitor) return data;

    const updatedVisitors = data.visitors.map(v => {
        if (v.status === 'serving') return { ...v, status: 'served' as const, isAlerting: false };
        if (v.id === nextVisitor.id) return { ...v, status: 'serving' as const, isAlerting: true }; // Trigger alert on call
        return v;
    });

    const newMetrics = {
        ...data.metrics,
        waiting: updatedVisitors.filter(v => v.status === 'waiting').length,
        served: data.metrics.served + 1
    };

    const newActivity: ActivityLog = {
        ticket: nextVisitor.ticketNumber,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'call'
    };

    const updatedData = {
        ...data,
        currentTicket: nextVisitor.ticketNumber,
        lastCalledNumber: nextVisitor.ticketNumber,
        visitors: updatedVisitors,
        metrics: newMetrics,
        recentActivity: [newActivity, ...data.recentActivity].slice(0, 50)
    };

    queueService.saveQueueData(queueId, updatedData);
    return updatedData;
  },

  callByNumber: (queueId: string, ticketNumber: number) => {
      const data = queueService.getQueueData(queueId);
      const visitor = data.visitors.find(v => v.ticketNumber === ticketNumber);

      if (!visitor) return data;

      const updatedVisitors = data.visitors.map(v => {
          if (v.status === 'serving') return { ...v, status: 'served' as const, isAlerting: false };
          if (v.ticketNumber === ticketNumber) return { ...v, status: 'serving' as const, isAlerting: true };
          return v;
      });

      const newActivity: ActivityLog = {
          ticket: ticketNumber,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'call',
          details: 'Manual'
      };

      const updatedData = {
          ...data,
          currentTicket: ticketNumber,
          lastCalledNumber: ticketNumber,
          visitors: updatedVisitors,
          metrics: { ...data.metrics, waiting: updatedVisitors.filter(v => v.status === 'waiting').length },
          recentActivity: [newActivity, ...data.recentActivity].slice(0, 50)
      };

      queueService.saveQueueData(queueId, updatedData);
      return updatedData;
  },

  takeBack: (queueId: string) => {
      const data = queueService.getQueueData(queueId);
      if (data.lastCalledNumber === 0) return data;

      const updatedVisitors = data.visitors.map(v => {
          if (v.ticketNumber === data.lastCalledNumber) {
              return { ...v, status: 'waiting' as const, isAlerting: false };
          }
          return v;
      });

      const updatedData = {
          ...data,
          visitors: updatedVisitors,
          metrics: { ...data.metrics, waiting: updatedVisitors.filter(v => v.status === 'waiting').length },
      };
      
      queueService.saveQueueData(queueId, updatedData);
      return updatedData;
  },
  
  clearQueue: (queueId: string) => {
      const data = queueService.getQueueData(queueId);
      
      const newActivity: ActivityLog = {
          ticket: 0,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'complete',
          details: 'Queue Cleared'
      };

      const updatedData = {
          ...data,
          visitors: [],
          metrics: { ...data.metrics, waiting: 0 },
          recentActivity: [newActivity, ...data.recentActivity].slice(0, 50)
      };
      queueService.saveQueueData(queueId, updatedData);
      return updatedData;
  },

  reset: (queueId: string) => {
    localStorage.setItem(getDataKey(queueId), JSON.stringify({ ...INITIAL_DATA, queueId }));
    return { ...INITIAL_DATA, queueId };
  },

  // Alert Control
  triggerAlert: (queueId: string, visitorId: string) => {
      const data = queueService.getQueueData(queueId);
      const updatedVisitors = data.visitors.map(v => 
          v.id === visitorId ? { ...v, isAlerting: true } : v
      );
      const updatedData = { ...data, visitors: updatedVisitors };
      queueService.saveQueueData(queueId, updatedData);
      return updatedData;
  },

  dismissAlert: (queueId: string, visitorId: string) => {
      const data = queueService.getQueueData(queueId);
      const updatedVisitors = data.visitors.map(v => 
          v.id === visitorId ? { ...v, isAlerting: false } : v
      );
      const updatedData = { ...data, visitors: updatedVisitors };
      queueService.saveQueueData(queueId, updatedData);
      return updatedData;
  }
};
