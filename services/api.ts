
import { API_BASE_URL } from './config';

class ApiClient {
  private baseUrl: string = API_BASE_URL;

  private async request(endpoint: string, method: string, body?: any) {
    const token = localStorage.getItem('qblink_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const url = `${this.baseUrl}/${cleanEndpoint}`;

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
        localStorage.removeItem('qblink_token');
        localStorage.removeItem('qblink_user');
        window.location.href = '/'; 
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
    }

    return response.json();
  }

  get(endpoint: string) { return this.request(endpoint, 'GET'); }
  post(endpoint: string, body: any) { return this.request(endpoint, 'POST', body); }
  put(endpoint: string, body: any) { return this.request(endpoint, 'PUT', body); }
  delete(endpoint: string) { return this.request(endpoint, 'DELETE'); }
}

export const api = new ApiClient();
