
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, serverTimestamp } from 'firebase/database';

// Access environment variables safely to avoid TS errors with import.meta.env
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

let app;
let auth;
let db;
let isAvailable = false;

try {
  // Initialize Firebase (Modular SDK)
  app = initializeApp(firebaseConfig);
  
  // Initialize Services
  auth = getAuth(app);
  db = getDatabase(app);
  
  isAvailable = true;
  console.log('🔥 Firebase Initialized: Realtime Database & Auth Active');
} catch (error) {
  console.error('Firebase Initialization Error:', error);
}

// Export services matching the existing app structure where possible
export const firebaseService = {
  auth,
  db,
  isAvailable,
  serverTimestamp // Exported to maintain potential compatibility with service calls
};
