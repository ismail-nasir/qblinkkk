
// Fallback to localhost if variables are missing (for local dev)
// VITE_ prefix is required for Vite to expose env vars to the frontend
export const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:3000/api';
export const SOCKET_BASE_URL = ((import.meta as any).env?.VITE_SOCKET_URL as string) || 'http://localhost:3000';
