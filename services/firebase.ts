
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Keys provided by user
const firebaseConfig = {
  apiKey: "AIzaSyATo677g8cfwQmn_dXHmQNhHQtnNYpibhc",
  authDomain: "qblink-86526177.firebaseapp.com",
  databaseURL: "https://qblink-86526177-default-rtdb.firebaseio.com",
  projectId: "qblink-86526177",
  storageBucket: "qblink-86526177.firebasestorage.app",
  messagingSenderId: "129053752902",
  appId: "1:129053752902:web:7ededf780eda112a26d447",
  measurementId: "G-2V8HCCMJT7"
};

let app;
let db: any;
let auth: any;
let isAvailable = false;

try {
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }

    // Initialize Services
    // Note: We use Firestore (db.collection) for this app, not Realtime DB
    db = firebase.firestore();
    auth = firebase.auth();
    isAvailable = true;
    
    console.log('🔥 Firebase Initialized successfully');
} catch (e) {
    console.error('Firebase initialization error:', e);
}

// Export the service wrapper compatible with existing components
export const firebaseService = {
    isAvailable,
    db,
    auth,
    serverTimestamp: () => firebase.firestore.FieldValue.serverTimestamp(),
    increment: (n: number) => firebase.firestore.FieldValue.increment(n)
};
