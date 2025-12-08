import { User } from '../types';

const USERS_KEY = 'qblink_users_v1';
const SESSION_KEY = 'qblink_session_v1';

// Helper to delay execution to simulate network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  // Get currently logged in user
  getCurrentUser: (): User | null => {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  },

  // Login
  login: async (email: string, password: string): Promise<User> => {
    await delay(800); // Simulate network latency

    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    // Simple lookup (in a real backend this would be a DB query)
    const userRecord = users[email];

    if (!userRecord || userRecord.password !== password) {
      throw new Error('Invalid email or password');
    }

    const user: User = {
      id: userRecord.id,
      email: userRecord.email,
      businessName: userRecord.businessName,
      joinedAt: new Date(userRecord.joinedAt)
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  // Signup
  signup: async (email: string, password: string, businessName: string): Promise<User> => {
    await delay(1000); // Simulate network latency

    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (users[email]) {
      throw new Error('An account with this email already exists');
    }

    const newUser = {
      id: crypto.randomUUID(),
      email,
      password, // In a real app, never store plain text passwords!
      businessName,
      joinedAt: new Date().toISOString()
    };

    // Save to "DB"
    users[email] = newUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Create session
    const user: User = {
      id: newUser.id,
      email: newUser.email,
      businessName: newUser.businessName,
      joinedAt: new Date(newUser.joinedAt)
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  // Logout
  logout: async () => {
    await delay(300);
    localStorage.removeItem(SESSION_KEY);
  }
};