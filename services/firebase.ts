
// Mock implementation of Firebase for Client-Side Simulation Mode
// This replaces the actual firebase SDK dependency to allow the app to run without external configuration.

export interface User {
    uid: string;
    email: string | null;
}

// --- Local Storage Helper for Mock DB ---
const DB_KEY = 'qblink_local_db';
const getStore = () => {
    try {
        return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
    } catch (e) {
        return {};
    }
};
const setStore = (data: any) => localStorage.setItem(DB_KEY, JSON.stringify(data));

// --- Event Emitter for Realtime Updates ---
const listeners: Map<string, Function[]> = new Map();

const trigger = (path: string) => {
    listeners.forEach((cbs, key) => {
        // Trigger if watching this path, or a parent of this path, or a child
        if (path.startsWith(key) || key.startsWith(path)) {
            const fullData = getStore();
            const parts = key.split('/').filter(Boolean);
            let d = fullData;
            for (const p of parts) d = d ? d[p] : null;
            
            const snapshot = {
                val: () => d,
                exists: () => d !== null && d !== undefined,
                key: parts[parts.length - 1] || null
            };
            cbs.forEach(cb => cb(snapshot));
        }
    });
};

// --- Mock Database SDK ---

export const getDatabase = (app?: any) => ({});

export const ref = (db: any, path: string = '') => ({
    path,
    key: path.split('/').pop() || null,
    toString: () => path
});

export const child = (parentRef: any, path: string) => {
    const parentPath = parentRef.path !== undefined ? parentRef.path : parentRef;
    const fullPath = `${parentPath}/${path}`.replace('//', '/');
    return ref(null, fullPath);
};

export const get = async (refObj: any) => {
    const path = refObj.path !== undefined ? refObj.path : refObj;
    const store = getStore();
    const parts = path.split('/').filter(Boolean);
    let curr = store;
    for(const p of parts) curr = curr ? curr[p] : null;
    return {
        val: () => curr,
        exists: () => curr !== null && curr !== undefined
    };
};

export const set = async (refObj: any, value: any) => {
    const path = refObj.path !== undefined ? refObj.path : refObj;
    const store = getStore();
    const parts = path.split('/').filter(Boolean);
    let curr = store;
    
    if (parts.length === 0) {
        setStore(value);
    } else {
        for(let i=0; i<parts.length-1; i++) {
            if(!curr[parts[i]]) curr[parts[i]] = {};
            curr = curr[parts[i]];
        }
        curr[parts[parts.length-1]] = value;
        setStore(store);
    }
    trigger(path);
};

export const update = async (refObj: any, updates: any) => {
    const path = refObj.path !== undefined ? refObj.path : refObj;
    const store = getStore();
    const parts = path.split('/').filter(Boolean);
    let curr = store;
    for(let i=0; i<parts.length; i++) {
        if(!curr[parts[i]]) curr[parts[i]] = {};
        curr = curr[parts[i]];
    }
    Object.assign(curr, updates);
    setStore(store);
    trigger(path);
};

export const push = (parentRef: any) => {
    const id = 'id_' + Math.random().toString(36).substr(2, 9);
    const parentPath = parentRef.path !== undefined ? parentRef.path : parentRef;
    const path = `${parentPath}/${id}`;
    return ref(null, path);
};

export const remove = async (refObj: any) => {
    const path = refObj.path !== undefined ? refObj.path : refObj;
    const store = getStore();
    const parts = path.split('/').filter(Boolean);
    let curr = store;
    for(let i=0; i<parts.length-1; i++) {
        if(!curr[parts[i]]) return;
        curr = curr[parts[i]];
    }
    delete curr[parts[parts.length-1]];
    setStore(store);
    trigger(path);
};

export const onValue = (refObj: any, callback: (snap: any) => void) => {
    const path = refObj.path !== undefined ? refObj.path : refObj;
    if (!listeners.has(path)) listeners.set(path, []);
    listeners.get(path)?.push(callback);
    
    // Initial call
    get(refObj).then(snap => callback(snap));

    return () => {
        const list = listeners.get(path) || [];
        listeners.set(path, list.filter(cb => cb !== callback));
    };
};

export const query = (refObj: any, ...constraints: any[]) => refObj;
export const orderByChild = (path: string) => ({ type: 'orderByChild', path });
export const serverTimestamp = () => new Date().toISOString();

// --- Mock Auth SDK ---

export const getAuth = (app?: any) => {
    const userStr = localStorage.getItem('qblink_user');
    return { 
        currentUser: userStr ? JSON.parse(userStr) : null 
    };
};

export const signInWithEmailAndPassword = async (auth: any, email: string, pass: string) => {
    // Simulate login - in mock mode we accept any email/pass or check against a "users" node in DB if we wanted to be strict
    // For simplicity, just return success
    const uid = 'user_' + email.replace(/\W/g, '');
    const user = { uid, email };
    return { user };
};

export const createUserWithEmailAndPassword = async (auth: any, email: string, pass: string) => {
    const uid = 'user_' + email.replace(/\W/g, '');
    return { user: { uid, email } };
};

export const signOut = async (auth: any) => {
    // Service layer handles localStorage clearing
};

export const onAuthStateChanged = (auth: any, callback: (user: any) => void) => {
    const userStr = localStorage.getItem('qblink_user');
    const user = userStr ? JSON.parse(userStr) : null;
    // Slight delay to simulate async
    setTimeout(() => callback(user), 100);
    return () => {};
};

export const sendPasswordResetEmail = async (auth: any, email: string) => {
    console.log("Mock password reset sent to " + email);
};

export const initializeApp = (config: any) => ({});

// --- Service Export ---

export const firebaseService = {
  auth: getAuth(),
  db: {}, // Mock DB object (truthy)
  isAvailable: true,
  serverTimestamp
};
