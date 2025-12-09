
import { User, AdminAuditLog } from '../types';
import { api } from './api';

const TOKEN_KEY = 'qblink_token';
const USER_KEY = 'qblink_user';

export const authService = {
  getToken: () => localStorage.getItem(TOKEN_KEY),

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  login: async (email: string, password: string): Promise<User> => {
    const { user, token } = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  signup: async (email: string, password: string, businessName: string): Promise<User> => {
    const { user, token } = await api.post('/auth/signup', { email, password, businessName });
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: async () => {
    try { await api.post('/auth/logout', {}); } catch(e) {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/';
  },

  deleteAccount: async (email: string) => {
      await api.delete('/auth/me');
      authService.logout();
  },

  verifyEmail: async (email: string, code: string) => { return authService.getCurrentUser()!; },
  resendVerification: async (email: string) => {},
  requestPasswordReset: async (email: string) => {},
  resetPassword: async (email: string, code: string, psw: string) => {},

  // Admin Methods
  getAllUsers: async (): Promise<User[]> => await api.get('/admin/users'),
  getAdmins: async (): Promise<string[]> => await api.get('/admin/list'),
  addAdmin: async (email: string) => await api.post('/admin/add', { email }),
  removeAdmin: async (email: string) => await api.post('/admin/remove', { email }),
  logAdminAction: async (adminEmail: string, action: string, target?: string) => await api.post('/admin/log', { adminEmail, action, target }),
  getAdminLogs: async (): Promise<AdminAuditLog[]> => await api.get('/admin/logs'),
  isAdmin: (email: string): boolean => {
      const user = authService.getCurrentUser();
      return user?.role === 'admin' || user?.role === 'superadmin';
  }
};
