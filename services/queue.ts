import { QueueData, QueueMetric, ActivityLog } from '../types';

const DATA_KEY_PREFIX = 'qblink_data_';

const INITIAL_DATA: QueueData = {
  currentTicket: 0,
  metrics: {
    waiting: 0,
    served: 0,
    avgWaitTime: 5
  },
  recentActivity: []
};

const getKey = (userId: string) => `${DATA_KEY_PREFIX}${userId}`;

export const queueService = {
  // Get data for a specific user
  getQueueData: (userId: string): QueueData => {
    const dataStr = localStorage.getItem(getKey(userId));
    if (!dataStr) {
      return { ...INITIAL_DATA }; // Return copy of initial data
    }
    try {
      return JSON.parse(dataStr);
    } catch {
      return { ...INITIAL_DATA };
    }
  },

  // Update specific fields
  updateQueue: (userId: string, updates: Partial<QueueData>) => {
    const current = queueService.getQueueData(userId);
    const updated = { ...current, ...updates };
    localStorage.setItem(getKey(userId), JSON.stringify(updated));
    return updated;
  },

  // Actions
  callNext: (userId: string) => {
    const data = queueService.getQueueData(userId);
    
    const newTicket = data.currentTicket + 1;
    const newMetrics = {
        ...data.metrics,
        waiting: Math.max(0, data.metrics.waiting - 1),
        served: data.metrics.served + 1
    };

    const newActivity: ActivityLog = {
        ticket: newTicket,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'call'
    };

    const updatedActivity = [newActivity, ...data.recentActivity].slice(0, 50); // Keep last 50

    const updated = {
        currentTicket: newTicket,
        metrics: newMetrics,
        recentActivity: updatedActivity
    };

    localStorage.setItem(getKey(userId), JSON.stringify(updated));
    return updated;
  },

  reset: (userId: string) => {
    localStorage.setItem(getKey(userId), JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
};