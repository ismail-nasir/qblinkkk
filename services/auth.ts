
import { User, AdminAuditLog } from '../types';
import { firebaseService } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { ref, get, set, child } from 'firebase/database';

const USER_KEY = 'qblink_user';

export const authService = {
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Listen for auth state changes
  initAuthListener: (callback: (user: User | null) => void) => {
      if (!firebaseService.auth) return;
      
      onAuthStateChanged(firebaseService.auth, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
              // Fetch extra user details from Realtime Database
              try {
                  const dbRef = ref(firebaseService.db);
                  const snapshot = await get(child(dbRef, `businesses/${firebaseUser.uid}`));
                  if (snapshot.exists()) {
                      const userData = snapshot.val() as User;
                      localStorage.setItem(USER_KEY, JSON.stringify(userData));
                      callback(userData);
                  } else {
                      // Fallback if profile doesn't exist in DB yet
                      callback(null);
                  }
              } catch (e) {
                  console.error("Auth Listener Error:", e);
                  callback(null);
              }
          } else {
              localStorage.removeItem(USER_KEY);
              callback(null);
          }
      });
  },

  login: async (email: string, password: string): Promise<User> => {
    if (!firebaseService.auth) throw new Error("Firebase not configured");
    
    // Modular Auth Call
    const credential = await signInWithEmailAndPassword(firebaseService.auth, email, password);
    
    // Modular Realtime DB Call
    const dbRef = ref(firebaseService.db);
    const snapshot = await get(child(dbRef, `businesses/${credential.user.uid}`));
    
    if (!snapshot.exists()) throw new Error("User profile not found.");
    
    const userData = snapshot.val() as User;
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return userData;
  },

  signup: async (email: string, password: string, businessName: string): Promise<User> => {
    if (!firebaseService.auth) throw new Error("Firebase not configured");

    // Modular Auth Call
    const credential = await createUserWithEmailAndPassword(firebaseService.auth, email, password);
    const uid = credential.user.uid;

    const newUser: User = {
        id: uid,
        email,
        businessName,
        role: 'owner',
        isVerified: true, // Auto-verify for MVP
        joinedAt: new Date().toISOString()
    };

    // Modular Realtime DB Call
    await set(ref(firebaseService.db, `businesses/${uid}`), newUser);
    
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  logout: async () => {
    if (firebaseService.auth) {
        // Modular Auth Call
        await signOut(firebaseService.auth);
    }
    localStorage.removeItem(USER_KEY);
    window.location.href = '/';
  },

  deleteAccount: async (email: string) => {
      console.warn("Account deletion requires Firebase Admin SDK or Cloud Function.");
      await authService.logout();
  },

  // Stub methods for compatibility
  verifyEmail: async (email: string, code: string): Promise<User> => { return authService.getCurrentUser()!; },
  resendVerification: async (email: string) => {},
  requestPasswordReset: async (email: string) => {
      if (firebaseService.auth) {
          await sendPasswordResetEmail(firebaseService.auth, email);
      }
  },
  resetPassword: async (email: string, code: string, pass: string) => {},
  getAllUsers: async (): Promise<User[]> => [],
  getAdmins: async (): Promise<string[]> => [],
  addAdmin: async (email: string) => {},
  removeAdmin: async (email: string) => {},
  logAdminAction: async (adminEmail: string, action: string, target: string) => {},
  getAdminLogs: async (): Promise<AdminAuditLog[]> => [],
  isAdmin: () => false
};
