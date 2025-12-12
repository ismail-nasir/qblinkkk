
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

// Helper to safely access env vars
const getEnv = (key: string) => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        return import.meta.env[key];
    }
    return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

let app;
let db: any;
let auth: any;
let isAvailable = false;

try {
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }
        db = firebase.firestore();
        auth = firebase.auth();
        isAvailable = true;
        console.log('🔥 Firebase Initialized (Compat)');
    } else {
        console.warn('⚠️ Firebase Config Missing: Please add VITE_FIREBASE_* variables.');
    }
} catch (e) {
    console.error('Firebase initialization error:', e);
}

export const firebaseService = {
    isAvailable,
    db,
    auth,
    serverTimestamp: () => firebase.firestore.FieldValue.serverTimestamp(),
    increment: (n: number) => firebase.firestore.FieldValue.increment(n)
};
