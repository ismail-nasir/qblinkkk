
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, serverTimestamp } from 'firebase/database';

const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (import.meta && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}
  
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {}
  
  return undefined;
};

// Configuration: Looks for VITE_ prefixed environment variables first, then standard keys
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Initialize Firebase
let app;
let auth;
let db;
let isAvailable = false;

try {
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getDatabase(app);
        isAvailable = true;
        console.log("🔥 Firebase Connected Successfully");
    } else {
        console.warn("⚠️ Firebase Config Missing. App will not function correctly without env variables.");
    }
} catch (e) {
    console.error("🔥 Firebase Initialization Error:", e);
}

export const firebaseService = {
  app,
  auth,
  db,
  isAvailable,
  serverTimestamp
};
