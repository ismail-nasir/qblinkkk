// Configuration Service
// In Vite/React, use import.meta.env
// In Create React App (CRA), use process.env.REACT_APP_...
// We fallback to a relative path for production deployments where API is served from same origin

const getEnv = (key: string) => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        return import.meta.env[key];
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
        // @ts-ignore
        return process.env[key] || process.env[`REACT_APP_${key.replace('VITE_', '')}`];
    }
    return '';
};

// Fallback logic: If env vars are missing, assume we are in local dev on default ports OR same-origin in prod
const DEV_API_URL = 'http://localhost:3000/api';
const DEV_SOCKET_URL = 'http://localhost:3000';

export const API_BASE_URL = getEnv('VITE_API_URL') || DEV_API_URL;
export const SOCKET_BASE_URL = getEnv('VITE_SOCKET_URL') || DEV_SOCKET_URL;

console.log('🔌 Configured API URL:', API_BASE_URL);
console.log('🔌 Configured Socket URL:', SOCKET_BASE_URL);
