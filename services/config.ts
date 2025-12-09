
// Configuration for API and WebSocket URLs
// When deploying, set VITE_API_URL and VITE_SOCKET_URL environment variables
// Example for Render/Heroku: https://my-qblink-backend.onrender.com

const getEnvVar = (key: string, fallback: string) => {
  // Check for Vite
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  // Check for Create React App / Webpack
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

// Default to localhost for local development, but ready for cloud injection
export const API_BASE_URL = getEnvVar('VITE_API_URL', 'http://localhost:3000/api');
export const SOCKET_BASE_URL = getEnvVar('VITE_SOCKET_URL', 'http://localhost:3000');