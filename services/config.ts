
// Configuration Service

const getEnv = (key: string) => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        return import.meta.env[key];
    }
    return '';
};

// Default to internal simulation if variables are missing
export const API_BASE_URL = getEnv('VITE_API_URL') || '/api';
export const SOCKET_BASE_URL = getEnv('VITE_SOCKET_URL') || '/';

console.log('🚀 Qblink Environment: Client-Side Simulation Mode Active');
