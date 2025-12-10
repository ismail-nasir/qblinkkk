import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, update, remove, runTransaction, child, get, onDisconnect } from 'firebase/database';

// Helper to safely access env vars to avoid TS errors with import.meta.env
const getEnv = (key: string) => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        return import.meta.env[key];
    }
    return undefined;
};

// Configuration placeholder - Check environment variables
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

let app;
let db: any;
let isInitialized = false;

try {
    if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        isInitialized = true;
        console.log('🔥 Firebase Initialized: Cloud Sync Active');
    } else {
        console.log('⚠️ Firebase Config Missing: Falling back to Local Simulation.');
    }
} catch (e) {
    console.error('Firebase initialization error:', e);
}

export const firebaseService = {
    isAvailable: isInitialized,
    db,
    ref,
    set,
    push,
    update,
    remove,
    onValue,
    runTransaction,
    child,
    get,
    onDisconnect
};