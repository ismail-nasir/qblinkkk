
import { QueueData, QueueMetric, ActivityLog, User, Visitor } from '../types';

const DATA_KEY_PREFIX = 'qblink_data_';

const INITIAL_DATA: QueueData = {
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

const getKey = (userId: string) => `${DATA_KEY_PREFIX}${userId}`;

export const queueService = {
  // Get data for a specific user (or generic if userId provided)
  getQueueData: (userId: string): QueueData => {
    const dataStr = localStorage.getItem(getKey(userId));
    if (!dataStr) {
      return { ...INITIAL_DATA };
    }
    try {
      const parsed = JSON.parse(dataStr);
      // Ensure compatibility with old data structure
      return { ...INITIAL_DATA, ...parsed };
    } catch {
      return { ...INITIAL_DATA };
    }
  },

  // Save data helper
  saveQueueData: (userId: string, data: QueueData) => {
    localStorage.setItem(getKey(userId), JSON.stringify(data));
  },

  // Get aggregated system logs (Admin)
  getSystemLogs: (users: User[]): (ActivityLog & { user: string, email: string })[] => {
    let allLogs: (ActivityLog & { user: string, email: string })[] = [];
    
    users.forEach(user => {
        const dataStr = localStorage.getItem(getKey(user.id));
        if (dataStr) {
            try {
                const data: QueueData = JSON.parse(dataStr);
                if (data.recentActivity && data.recentActivity.length > 0) {
                    const labeledLogs = data.recentActivity.map(log => ({
                        ...log,
                        user: user.businessName,
                        email: user.email
                    }));
                    allLogs = [...allLogs, ...labeledLogs];
                }
            } catch (e) {
                // Ignore malformed data
            }
        }
    });
    return allLogs.reverse(); 
  },

  // --- ACTIONS ---

  // Customer Joins Queue
  joinQueue: (userId: string, name: string): { visitor: Visitor, queueData: QueueData } => {
    const data = queueService.getQueueData(userId);
    
    // Calculate new ticket number (highest ticket + 1, or 1)
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
    
    // Update metrics
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

    queueService.saveQueueData(userId, updatedData);
    return { visitor: newVisitor, queueData: updatedData };
  },

  // Customer Leaves Queue
  leaveQueue: (userId: string, visitorId: string) => {
      const data = queueService.getQueueData(userId);
      const updatedVisitors = data.visitors.map(v => 
          v.id === visitorId ? { ...v, status: 'cancelled' as const } : v
      ).filter(v => v.status !== 'cancelled'); // Actually remove them or keep as cancelled? Let's remove for cleaner list, or keep for history. Requirements said "Leave Queue", usually implies removal.

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

      queueService.saveQueueData(userId, updatedData);
      return updatedData;
  },

  // Manager Calls Next
  callNext: (userId: string) => {
    const data = queueService.getQueueData(userId);
    
    // Find next waiting
    const nextVisitor = data.visitors
        .filter(v => v.status === 'waiting')
        .sort((a, b) => a.ticketNumber - b.ticketNumber)[0];

    if (!nextVisitor) return data; // No one to call

    // Mark previous serving as served (if any)
    const updatedVisitors = data.visitors.map(v => {
        if (v.status === 'serving') return { ...v, status: 'served' as const };
        if (v.id === nextVisitor.id) return { ...v, status: 'serving' as const };
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

    queueService.saveQueueData(userId, updatedData);
    return updatedData;
  },

  // Manager Calls Specific Number
  callByNumber: (userId: string, ticketNumber: number) => {
      const data = queueService.getQueueData(userId);
      const visitor = data.visitors.find(v => v.ticketNumber === ticketNumber);

      if (!visitor) return data;

      const updatedVisitors = data.visitors.map(v => {
          if (v.status === 'serving') return { ...v, status: 'served' as const };
          if (v.ticketNumber === ticketNumber) return { ...v, status: 'serving' as const };
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

      queueService.saveQueueData(userId, updatedData);
      return updatedData;
  },

  // Take Back (Undo served status of last called)
  takeBack: (userId: string) => {
      const data = queueService.getQueueData(userId);
      if (data.lastCalledNumber === 0) return data;

      // Find the currently serving or last served
      const updatedVisitors = data.visitors.map(v => {
          if (v.ticketNumber === data.lastCalledNumber) {
              return { ...v, status: 'waiting' as const };
          }
          return v;
      });

      // We don't decrement served count to keep history accurate, or we do? 
      // Let's assume "Take back" means "oops, they aren't done or I clicked wrong"
      // So we put them back in waiting.

      const updatedData = {
          ...data,
          visitors: updatedVisitors,
          metrics: { ...data.metrics, waiting: updatedVisitors.filter(v => v.status === 'waiting').length },
          // Don't change lastCalledNumber immediately or set it to previous?
          // For simplicity, just update the status.
      };
      
      queueService.saveQueueData(userId, updatedData);
      return updatedData;
  },
  
  // Clear Queue
  clearQueue: (userId: string) => {
      const data = queueService.getQueueData(userId);
      
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
      queueService.saveQueueData(userId, updatedData);
      return updatedData;
  },

  reset: (userId: string) => {
    localStorage.setItem(getKey(userId), JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
};
