
import { API_BASE_URL } from './config';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request(endpoint: string, method: string, body?: any) {
    const token = localStorage.getItem('qblink_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const url = `${this.baseUrl}/${cleanEndpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle Unauthorized (Token Expired)
      if (response.status === 401) {
        // Only redirect if not already on auth page to prevent loops
        if (!window.location.pathname.includes('auth') && localStorage.getItem('qblink_token')) {
           localStorage.removeItem('qblink_token');
           localStorage.removeItem('qblink_user');
           window.location.href = '/'; // Redirect to landing
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`API Request Failed: ${method} ${url}`, error);
      throw error;
    }
  }

  get(endpoint: string) {
    return this.request(endpoint, 'GET');
  }

  post(endpoint: string, body: any) {
    return this.request(endpoint, 'POST', body);
  }

  put(endpoint: string, body: any) {
    return this.request(endpoint, 'PUT', body);
  }

  delete(endpoint: string) {
    return this.request(endpoint, 'DELETE');
  }
}

export const api = new ApiClient();
