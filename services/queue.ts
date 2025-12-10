
import { QueueData, QueueInfo, Visitor, ActivityLog } from '../types';
import { api } from './api';

export const queueService = {
  getUserQueues: async (userId: string): Promise<QueueInfo[]> => await api.get('/queue'),
  createQueue: async (userId: string, name: string, estimatedWaitTime?: number): Promise<QueueInfo> => await api.post('/queue', { name, estimatedWaitTime }),
  updateQueue: async (userId: string, queueId: string, updates: Partial<QueueInfo>): Promise<QueueInfo | null> => await api.put(`/queue/${queueId}`, updates),
  deleteQueue: async (userId: string, queueId: string) => await api.delete(`/queue/${queueId}`),
  getQueueInfo: async (queueId: string): Promise<QueueInfo | null> => await api.get(`/queue/${queueId}/info`),
  getQueueData: async (queueId: string): Promise<QueueData> => await api.get(`/queue/${queueId}/data`),
  
  joinQueue: async (queueId: string, name: string, source: 'manual' | 'qr' = 'qr'): Promise<{ visitor: Visitor, queueData: QueueData }> => await api.post('/queue/join', { queueId, name, source }),
  leaveQueue: async (queueId: string, visitorId: string) => await api.post(`/queue/${queueId}/leave`, { visitorId }),
  
  callNext: async (queueId: string) => await api.post(`/queue/${queueId}/call`, {}),
  callByNumber: async (queueId: string, ticketNumber: number) => await api.post(`/queue/${queueId}/call-number`, { ticketNumber }),
  recallVisitor: async (queueId: string, visitorId: string) => await api.post(`/queue/${queueId}/recall`, { visitorId }),
  takeBack: async (queueId: string) => await api.post(`/queue/${queueId}/take-back`, {}),
  clearQueue: async (queueId: string) => await api.post(`/queue/${queueId}/clear`, {}),
  
  triggerAlert: async (queueId: string, visitorId: string) => await api.post(`/queue/${queueId}/alert`, { visitorId, type: 'trigger' }),
  dismissAlert: async (queueId: string, visitorId: string) => await api.post(`/queue/${queueId}/alert`, { visitorId, type: 'dismiss' }),
  reorderQueue: async (queueId: string, visitors: Visitor[]) => await api.post(`/queue/${queueId}/reorder`, { visitors }),
  
  togglePriority: async (queueId: string, visitorId: string, isPriority: boolean) => await api.post(`/queue/${queueId}/priority`, { visitorId, isPriority }),

  getSystemLogs: async (): Promise<(ActivityLog & { user: string, email: string })[]> => await api.get('/admin/system-logs'),

  // Export/Import stubbed for cloud version as persistence is handled by DB
  exportUserData: async (userId: string) => {},
  importUserData: async (userId: string, file: File) => false,
};
