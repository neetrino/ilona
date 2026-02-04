const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface FetchOptions extends RequestInit {
  token?: string;
  skipAuthRefresh?: boolean; // Flag to skip auto-refresh for auth endpoints
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

type TokenRefreshCallback = () => Promise<boolean>;

class ApiClient {
  private baseUrl: string;
  private refreshCallback: TokenRefreshCallback | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set the token refresh callback
   * This should be called from the auth store after initialization
   */
  setRefreshCallback(callback: TokenRefreshCallback) {
    this.refreshCallback = callback;
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

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('ilona-auth');
      if (stored) {
        const data = JSON.parse(stored);
        return data?.state?.tokens?.refreshToken || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {},
    isRetry = false
  ): Promise<T> {
    const { token: explicitToken, skipAuthRefresh, ...fetchOptions } = options;
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

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && !skipAuthRefresh && !isRetry) {
      // Skip refresh for auth endpoints to avoid infinite loops
      if (endpoint.startsWith('/auth/')) {
        const errorData = data as ApiErrorResponse;
        const message = Array.isArray(errorData.message) 
          ? errorData.message[0] 
          : errorData.message || errorData.error || 'Unauthorized';
        throw new ApiError(
          message,
          response.status,
          Array.isArray(errorData.message) ? errorData.message : undefined
        );
      }

      // Attempt to refresh token
      const refreshSuccess = await this.attemptTokenRefresh();
      
      if (refreshSuccess) {
        // Wait a bit to ensure token is available in localStorage
        await new Promise(resolve => setTimeout(resolve, 100));
        // Retry the original request with new token
        return this.request<T>(endpoint, { ...options, skipAuthRefresh: true }, true);
      } else {
        // Refresh failed, throw the original error
        const errorData = data as ApiErrorResponse;
        const message = Array.isArray(errorData.message) 
          ? errorData.message[0] 
          : errorData.message || errorData.error || 'Unauthorized';
        throw new ApiError(
          message,
          response.status,
          Array.isArray(errorData.message) ? errorData.message : undefined
        );
      }
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

  /**
   * Attempt to refresh the access token
   * Returns true if successful, false otherwise
   */
  private async attemptTokenRefresh(): Promise<boolean> {
    // If already refreshing, wait for the existing refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Use callback if available (preferred method)
    if (this.refreshCallback) {
      this.isRefreshing = true;
      this.refreshPromise = this.refreshCallback()
        .then(async (success) => {
          this.isRefreshing = false;
          this.refreshPromise = null;
          // Give a small delay to ensure localStorage is updated
          if (success && typeof window !== 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          return success;
        })
        .catch(() => {
          this.isRefreshing = false;
          this.refreshPromise = null;
          return false;
        });
      return this.refreshPromise;
    }

    // Fallback: direct refresh token API call
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          return false;
        }

        const newTokens = await response.json();
        
        // Update tokens in localStorage
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('ilona-auth');
            if (stored) {
              const data = JSON.parse(stored);
              data.state.tokens = newTokens;
              localStorage.setItem('ilona-auth', JSON.stringify(data));
            }
          } catch {
            return false;
          }
        }

        return true;
      } catch {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
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
