
import { authService } from './auth';

// Allow dynamic configuration of API URL for cross-device testing
const getBaseUrl = () => {
    const stored = localStorage.getItem('qblink_api_url');
    // Default to port 3000 to match backend/server.ts
    return stored || 'http://localhost:3000/api';
};

interface RequestOptions extends RequestInit {
  token?: string | null;
}

// Helper: Convert snake_case keys to camelCase
const toCamel = (s: string) => {
    return s.replace(/([-_][a-z])/ig, ($1) => {
        return $1.toUpperCase().replace('-', '').replace('_', '');
    });
};

const isObject = (o: any) => {
    return o === Object(o) && !Array.isArray(o) && typeof o !== 'function';
};

const keysToCamel = (o: any): any => {
    if (isObject(o)) {
        const n: any = {};
        Object.keys(o).forEach((k) => {
            n[toCamel(k)] = keysToCamel(o[k]);
        });
        return n;
    } else if (Array.isArray(o)) {
        return o.map((i) => keysToCamel(i));
    }
    return o;
};

// Helper: Convert camelCase keys to snake_case for backend
const toSnake = (s: string) => {
    return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

const keysToSnake = (o: any): any => {
    if (isObject(o)) {
        const n: any = {};
        Object.keys(o).forEach((k) => {
            n[toSnake(k)] = keysToSnake(o[k]);
        });
        return n;
    } else if (Array.isArray(o)) {
        return o.map((i) => keysToSnake(i));
    }
    return o;
};

class ApiService {
  private async request(endpoint: string, options: RequestOptions = {}) {
    const url = `${getBaseUrl()}${endpoint}`;
    
    // Auto-attach token if exists
    const token = options.token || authService.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers as any,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Transform body to snake_case if it exists and is an object
    if (options.body && typeof options.body === 'string') {
        try {
            const parsed = JSON.parse(options.body);
            options.body = JSON.stringify(keysToSnake(parsed));
        } catch(e) {
            // Ignore if not JSON
        }
    }

    const config = {
      ...options,
      headers,
    };

    try {
        let response = await fetch(url, config);

        // Handle 401 - Token Expired
        if (response.status === 401 && !url.includes('login')) {
          await authService.logout();
          // Don't throw here, let the UI handle the redirect via auth state clearing
          throw new Error('Session expired');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'API Request Failed');
        }

        // Return empty if no content
        if (response.status === 204) return null;

        const data = await response.json();
        return keysToCamel(data);
    } catch (e: any) {
        // Enhance network error message
        if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
            console.error("Network Error Details:", e);
            throw new Error(`Cannot connect to server at ${getBaseUrl()}. Ensure backend is running.`);
        }
        throw e;
    }
  }

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Utility to set URL
  setBaseUrl(url: string) {
      // Remove trailing slash and /api if present to normalize
      let cleanUrl = url.replace(/\/$/, '').replace(/\/api$/, '');
      if (!cleanUrl.startsWith('http')) cleanUrl = `http://${cleanUrl}`;
      
      localStorage.setItem('qblink_api_url', `${cleanUrl}/api`);
      localStorage.setItem('qblink_socket_url', cleanUrl);
  }
  
  get currentUrl() {
      return getBaseUrl().replace('/api', '');
  }
}

export const api = new ApiService();
