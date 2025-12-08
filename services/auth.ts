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

  // Get all users (Admin only)
  getAllUsers: (): User[] => {
    const usersStr = localStorage.getItem(USERS_KEY);
    if (!usersStr) return [];
    try {
        const usersObj = JSON.parse(usersStr);
        return Object.values(usersObj);
    } catch {
        return [];
    }
  },

  // Login
  login: async (email: string, password: string): Promise<User> => {
    await delay(800); // Simulate network latency
    const normalizedEmail = email.toLowerCase().trim();

    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    const userRecord = users[normalizedEmail];

    if (!userRecord || userRecord.password !== password) {
      throw new Error('Invalid email or password');
    }

    const user: User = {
      id: userRecord.id,
      email: userRecord.email,
      businessName: userRecord.businessName,
      joinedAt: new Date(userRecord.joinedAt),
      isVerified: userRecord.isVerified || false
    };

    // If not verified, we still return the user but the UI will handle the redirect to verification
    if (user.isVerified) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
    
    return user;
  },

  // Signup
  signup: async (email: string, password: string, businessName: string): Promise<User> => {
    await delay(1000); // Simulate network latency
    const normalizedEmail = email.toLowerCase().trim();

    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (users[normalizedEmail]) {
      throw new Error('An account with this email already exists');
    }

    const newUser = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      password, // In a real app, never store plain text passwords!
      businessName,
      joinedAt: new Date().toISOString(),
      isVerified: false
    };

    // Save to "DB"
    users[normalizedEmail] = newUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Return user object (session not created yet until verification)
    return {
      id: newUser.id,
      email: newUser.email,
      businessName: newUser.businessName,
      joinedAt: new Date(newUser.joinedAt),
      isVerified: false
    };
  },

  // Verify Email
  verifyEmail: async (email: string, code: string): Promise<User> => {
      await delay(800);
      const normalizedEmail = email.toLowerCase().trim();
      
      // Simulation: Accept generic code
      if (code !== '123456') {
          throw new Error("Invalid verification code");
      }

      const usersStr = localStorage.getItem(USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};
      const userRecord = users[normalizedEmail];

      if (!userRecord) {
          throw new Error("User not found");
      }

      // Update user
      userRecord.isVerified = true;
      users[normalizedEmail] = userRecord;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Create session
      const user: User = {
          id: userRecord.id,
          email: userRecord.email,
          businessName: userRecord.businessName,
          joinedAt: new Date(userRecord.joinedAt),
          isVerified: true
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));

      return user;
  },

  // Resend Verification Code
  resendVerification: async (email: string): Promise<void> => {
      await delay(500);
      // In a real app, this triggers an email API
      console.log(`Resending verification to ${email}`);
  },

  // Request Password Reset
  requestPasswordReset: async (email: string): Promise<void> => {
      await delay(800);
      const normalizedEmail = email.toLowerCase().trim();

      const usersStr = localStorage.getItem(USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};
      
      if (!users[normalizedEmail]) {
          // Security practice: Don't reveal if email exists, but for this simulation we just succeed
          return;
      }
      // Simulation: Logic to send email would go here
  },

  // Reset Password
  resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
      await delay(1000);
      const normalizedEmail = email.toLowerCase().trim();

      if (code !== '123456') {
          throw new Error("Invalid reset code");
      }

      const usersStr = localStorage.getItem(USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};
      const userRecord = users[normalizedEmail];

      if (!userRecord) {
           throw new Error("User not found");
      }

      userRecord.password = newPassword;
      users[normalizedEmail] = userRecord;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  // Delete Account
  deleteAccount: async (email: string): Promise<void> => {
    await delay(1000);
    const normalizedEmail = email.toLowerCase().trim();
    
    const usersStr = localStorage.getItem(USERS_KEY);
    if (usersStr) {
        const users = JSON.parse(usersStr);
        const user = users[normalizedEmail];
        
        if (user) {
             // Attempt to clean up queue data
             // Note: Queue data key prefix is 'qblink_data_' + userId
             localStorage.removeItem(`qblink_data_${user.id}`);
             
             // Remove user from users list
             delete users[normalizedEmail];
             localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
    }
    
    // Clear session
    localStorage.removeItem(SESSION_KEY);
  },

  // Logout
  logout: async () => {
    await delay(300);
    localStorage.removeItem(SESSION_KEY);
  }
};