import { QueueData, QueueInfo, Visitor, QueueSettings, ActivityLog } from '../types';
import { api } from './api';

export const queueService = {
  
  // --- Queue Management ---

  getUserQueues: async (userId: string): Promise<QueueInfo[]> => {
    return await api.get('/queue');
  },

  createQueue: async (userId: string, name: string, estimatedWaitTime?: number): Promise<QueueInfo> => {
    return await api.post('/queue', { name, estimatedWaitTime });
  },

  updateQueue: async (userId: string, queueId: string, updates: Partial<QueueInfo>): Promise<QueueInfo | null> => {
    return await api.put(`/queue/${queueId}`, updates);
  },

  deleteQueue: async (userId: string, queueId: string) => {
    return await api.delete(`/queue/${queueId}`);
  },

  getQueueInfo: async (queueId: string): Promise<QueueInfo | null> => {
      return await api.get(`/queue/${queueId}/info`);
  },

  // --- Queue Operations ---

  getQueueData: async (queueId: string): Promise<QueueData> => {
    return await api.get(`/queue/${queueId}/data`);
  },

  joinQueue: async (queueId: string, name: string): Promise<{ visitor: Visitor, queueData: QueueData }> => {
    // The backend should return the visitor and updated queue state
    const result = await api.post('/queue/join', { queueId, name });
    return { visitor: result.visitor, queueData: result.queueData };
  },

  leaveQueue: async (queueId: string, visitorId: string) => {
    return await api.post(`/queue/${queueId}/leave`, { visitorId });
  },

  callNext: async (queueId: string) => {
    return await api.post(`/queue/${queueId}/call`, {});
  },

  callByNumber: async (queueId: string, ticketNumber: number) => {
    return await api.post(`/queue/${queueId}/call-number`, { ticketNumber });
  },

  recallVisitor: async (queueId: string, visitorId: string) => {
    return await api.post(`/queue/${queueId}/recall`, { visitorId });
  },

  takeBack: async (queueId: string) => {
    return await api.post(`/queue/${queueId}/take-back`, {});
  },
  
  clearQueue: async (queueId: string) => {
    return await api.post(`/queue/${queueId}/clear`, {});
  },

  triggerAlert: async (queueId: string, visitorId: string) => {
    return await api.post(`/queue/${queueId}/alert`, { visitorId, type: 'trigger' });
  },

  dismissAlert: async (queueId: string, visitorId: string) => {
    return await api.post(`/queue/${queueId}/alert`, { visitorId, type: 'dismiss' });
  },

  reorderQueue: async (queueId: string, visitors: Visitor[]) => {
      return await api.post(`/queue/${queueId}/reorder`, { visitors });
  },

  getSystemLogs: async (): Promise<(ActivityLog & { user: string, email: string })[]> => {
    return await api.get('/admin/system-logs');
  },

  // --- Data Sync (Import/Export) ---
  
  exportUserData: async (userId: string) => {
    const data = await api.get('/queue/export');
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qblink_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importUserData: async (userId: string, file: File): Promise<boolean> => {
      const formData = new FormData();
      formData.append('file', file);
      try {
          // Note: using raw fetch here because API client is JSON optimized
          const token = localStorage.getItem('qblink_token');
          await fetch('http://localhost:5000/api/queue/import', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
          });
          return true;
      } catch (e) {
          console.error(e);
          return false;
      }
  }
};