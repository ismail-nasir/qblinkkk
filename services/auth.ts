
import { User, AdminAuditLog } from '../types';
import { firebaseService } from './firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const USER_KEY = 'qblink_user';

export const authService = {
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Listen for auth state changes
  initAuthListener: (callback: (user: User | null) => void) => {
      if (!firebaseService.auth) return;
      
      onAuthStateChanged(firebaseService.auth, async (firebaseUser) => {
          if (firebaseUser) {
              // Fetch extra user details from Firestore
              const userDoc = await getDoc(doc(firebaseService.db, 'businesses', firebaseUser.uid));
              if (userDoc.exists()) {
                  const userData = userDoc.data() as User;
                  localStorage.setItem(USER_KEY, JSON.stringify(userData));
                  callback(userData);
              } else {
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
    
    const credential = await signInWithEmailAndPassword(firebaseService.auth, email, password);
    const userDoc = await getDoc(doc(firebaseService.db, 'businesses', credential.user.uid));
    
    if (!userDoc.exists()) throw new Error("User profile not found.");
    
    const userData = userDoc.data() as User;
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return userData;
  },

  signup: async (email: string, password: string, businessName: string): Promise<User> => {
    if (!firebaseService.auth) throw new Error("Firebase not configured");

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

    // Save business profile to Firestore
    await setDoc(doc(firebaseService.db, 'businesses', uid), newUser);
    
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
      console.warn("Account deletion requires Firebase Admin SDK or Cloud Function.");
      await authService.logout();
  },

  // Mock-compatible method stubs
  verifyEmail: async (email: string, code: string): Promise<User> => { return authService.getCurrentUser()!; },
  resendVerification: async (email: string) => {},
  requestPasswordReset: async (email: string) => {},
  resetPassword: async (email: string, code: string, pass: string) => {},
  getAllUsers: async (): Promise<User[]> => [],
  getAdmins: async (): Promise<string[]> => [],
  addAdmin: async (email: string) => {},
  removeAdmin: async (email: string) => {},
  logAdminAction: async (adminEmail: string, action: string, target: string) => {},
  getAdminLogs: async (): Promise<AdminAuditLog[]> => [],
  isAdmin: () => false
};
