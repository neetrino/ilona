const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export class ApiError extends Error {
  statusCode: number;
  details?: string[];

  constructor(message: string, statusCode: number, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('ilona-auth');
      if (stored) {
        const data = JSON.parse(stored);
        return data?.state?.tokens?.accessToken || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token: explicitToken, ...fetchOptions } = options;
    const token = explicitToken || this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    let data: T | ApiErrorResponse;
    const text = await response.text();
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new ApiError('Invalid response from server', response.status);
    }

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      const message = Array.isArray(errorData.message) 
        ? errorData.message[0] 
        : errorData.message || errorData.error || 'An error occurred';
      throw new ApiError(
        message,
        response.status,
        Array.isArray(errorData.message) ? errorData.message : undefined
      );
    }

    return data as T;
  }

  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);
