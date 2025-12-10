
import { API_BASE_URL } from './config';
import { mockBackend } from './mockBackend';

const USE_MOCK_BACKEND = true; // Forced true for browser-only demo

class ApiClient {
  private baseUrl: string = API_BASE_URL;

  private async request(endpoint: string, method: string, body?: any) {
    // --- MOCK INTERCEPTION ---
    if (USE_MOCK_BACKEND) {
        // Retrieve current user from local storage token simulation for context
        const userStr = localStorage.getItem('qblink_user');
        const user = userStr ? JSON.parse(userStr) : undefined;
        
        try {
            const response = await mockBackend.handleRequest(method, endpoint, body, user);
            return response;
        } catch (error: any) {
            console.error("Mock API Error:", error);
            throw error; // Re-throw to be caught by UI
        }
    }
    // -------------------------

    const token = localStorage.getItem('qblink_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const url = `${this.baseUrl}/${cleanEndpoint}`;

    try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 401) {
            localStorage.removeItem('qblink_token');
            localStorage.removeItem('qblink_user');
            if (!window.location.pathname.includes('/auth') && window.location.pathname !== '/') {
                window.location.href = '/'; 
            }
            throw new Error('Unauthorized');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Request failed');
        }

        return data;
    } catch (error: any) {
        console.error(`API Request Failed: ${method} ${url}`, error);
        throw error;
    }
  }

  get(endpoint: string) { return this.request(endpoint, 'GET'); }
  post(endpoint: string, body: any) { return this.request(endpoint, 'POST', body); }
  put(endpoint: string, body: any) { return this.request(endpoint, 'PUT', body); }
  delete(endpoint: string) { return this.request(endpoint, 'DELETE'); }
}

export const api = new ApiClient();
