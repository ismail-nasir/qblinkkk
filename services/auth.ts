
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

// Helper to create a default profile if one is missing in the new DB
const createDefaultProfile = async (uid: string, email: string) => {
    const newUser: User = {
        id: uid,
        email: email || '',
        businessName: 'My Business', // Default name
        role: 'owner',
        isVerified: true,
        joinedAt: new Date().toISOString()
    };
    if (firebaseService.db) {
        await set(ref(firebaseService.db, `businesses/${uid}`), newUser);
    }
    return newUser;
};

export const authService = {
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  initAuthListener: (callback: (user: User | null) => void) => {
      if (!firebaseService.auth) return;
      
      onAuthStateChanged(firebaseService.auth, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser && firebaseService.db) {
              try {
                  const dbRef = ref(firebaseService.db);
                  const snapshot = await get(child(dbRef, `businesses/${firebaseUser.uid}`));
                  
                  if (snapshot.exists()) {
                      const userData = snapshot.val() as User;
                      localStorage.setItem(USER_KEY, JSON.stringify(userData));
                      callback(userData);
                  } else {
                      // RECOVERY: Profile missing in new DB? Create it automatically.
                      const newUser = await createDefaultProfile(firebaseUser.uid, firebaseUser.email || '');
                      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
                      callback(newUser);
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
    if (!firebaseService.auth || !firebaseService.db) throw new Error("Firebase not initialized");
    
    const credential = await signInWithEmailAndPassword(firebaseService.auth, email, password);
    const dbRef = ref(firebaseService.db);
    const snapshot = await get(child(dbRef, `businesses/${credential.user.uid}`));
    
    let userData: User;

    if (snapshot.exists()) {
        userData = snapshot.val() as User;
    } else {
        // RECOVERY: Create profile if missing during login
        userData = await createDefaultProfile(credential.user.uid, email);
    }
    
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return userData;
  },

  signup: async (email: string, password: string, businessName: string): Promise<User> => {
    if (!firebaseService.auth || !firebaseService.db) throw new Error("Firebase not initialized");

    const credential = await createUserWithEmailAndPassword(firebaseService.auth, email, password);
    const uid = credential.user.uid;

    const newUser: User = {
        id: uid,
        email,
        businessName,
        role: 'owner',
        isVerified: true,
        joinedAt: new Date().toISOString()
    };

    await set(ref(firebaseService.db, `businesses/${uid}`), newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  logout: async () => {
    if (firebaseService.auth) {
        await signOut(firebaseService.auth);
    }
    localStorage.removeItem(USER_KEY);
    window.location.href = '/';
  },

  deleteAccount: async (email: string) => {
      console.warn("Account deletion requires Firebase Admin SDK.");
      await authService.logout();
  },

  verifyEmail: async (email: string, code: string): Promise<User> => { return authService.getCurrentUser()!; },
  resendVerification: async (email: string) => {},
  requestPasswordReset: async (email: string) => {
      if (firebaseService.auth) await sendPasswordResetEmail(firebaseService.auth, email);
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
