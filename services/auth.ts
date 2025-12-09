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

  // Login
  login: async (email: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response;
    
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return user;
  },

  // Signup
  signup: async (email: string, password: string, businessName: string): Promise<User> => {
    const response = await api.post('/auth/signup', { email, password, businessName });
    // The backend might return user + token immediately
    const { user, token } = response;
    
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return user;
  },

  // Verify Email (Requires backend implementation, assuming stub or real endpoint)
  verifyEmail: async (email: string, code: string): Promise<User> => {
      const response = await api.post('/auth/verify', { email, code });
      const { user, token } = response;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
  },

  resendVerification: async (email: string): Promise<void> => {
      await api.post('/auth/resend-verification', { email });
  },

  requestPasswordReset: async (email: string): Promise<void> => {
      await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
      await api.post('/auth/reset-password', { email, code, password: newPassword });
  },

  deleteAccount: async (email: string): Promise<void> => {
      await api.delete('/auth/me');
      await authService.logout();
  },

  logout: async () => {
    try {
        await api.post('/auth/logout', {}); // Notify backend to invalidate token
    } catch(e) {
        // Ignore errors on logout
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.reload();
  },

  // --- Admin Logic (If backend supports these roles) ---
  
  getAllUsers: async (): Promise<User[]> => {
      return await api.get('/admin/users');
  },

  getAdmins: async (): Promise<string[]> => {
      return await api.get('/admin/list');
  },

  isAdmin: (email: string): boolean => {
      const user = authService.getCurrentUser();
      return user?.role === 'admin' || user?.role === 'superadmin' || email === 'ismailnsm75@gmail.com';
  },

  addAdmin: async (email: string): Promise<void> => {
      await api.post('/admin/add', { email });
  },

  removeAdmin: async (email: string): Promise<void> => {
      await api.post('/admin/remove', { email });
  },

  logAdminAction: async (adminEmail: string, action: string, target?: string) => {
      await api.post('/admin/log', { adminEmail, action, target });
  },

  getAdminLogs: async (): Promise<AdminAuditLog[]> => {
      return await api.get('/admin/logs');
  }
};