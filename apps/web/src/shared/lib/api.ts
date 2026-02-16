// Get API URL from environment or construct from current host
function getApiUrl(): string {
  // If explicitly set in environment, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In browser, construct from current host
  if (typeof window !== 'undefined') {
    const host = window.location.host;
    const protocol = window.location.protocol;
    // If running on port 3000, assume API is on 4000
    // Otherwise, use same host and port
    if (host.includes(':3000')) {
      return `${protocol}//${host.split(':')[0]}:4000/api`;
    }
    // For production or custom ports, try same host with /api
    return `${protocol}//${host}/api`;
  }

  // Server-side fallback
  return 'http://localhost:4000/api';
}

const API_URL = getApiUrl();

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
type LogoutCallback = () => void;
type TokenGetter = () => string | null;
type RefreshTokenGetter = () => string | null;

class ApiClient {
  private baseUrl: string;
  private refreshCallback: TokenRefreshCallback | null = null;
  private logoutCallback: LogoutCallback | null = null;
  private tokenGetter: TokenGetter | null = null;
  private refreshTokenGetter: RefreshTokenGetter | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set the token refresh callback and getters
   * This should be called from the auth store after initialization
   */
  setRefreshCallback(callback: TokenRefreshCallback) {
    this.refreshCallback = callback;
  }

  /**
   * Set the logout callback
   * This should be called from the auth store after initialization
   */
  setLogoutCallback(callback: LogoutCallback) {
    this.logoutCallback = callback;
  }

  /**
   * Set token getters to read from Zustand store directly
   * This ensures we always have the latest token state
   */
  setTokenGetters(tokenGetter: TokenGetter, refreshTokenGetter: RefreshTokenGetter) {
    this.tokenGetter = tokenGetter;
    this.refreshTokenGetter = refreshTokenGetter;
  }

  private getToken(): string | null {
    // Try to get from Zustand store first (more reliable)
    if (this.tokenGetter) {
      try {
        const token = this.tokenGetter();
        if (token) return token;
      } catch {
        // Fallback to localStorage
      }
    }

    // Fallback to localStorage
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
    // Try to get from Zustand store first (more reliable)
    if (this.refreshTokenGetter) {
      try {
        const token = this.refreshTokenGetter();
        if (token) return token;
      } catch {
        // Fallback to localStorage
      }
    }

    // Fallback to localStorage
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
    let token = explicitToken || this.getToken();

    // Don't set Content-Type for FormData - browser will set it with boundary
    const isFormData = fetchOptions.body instanceof FormData;
    const headers: HeadersInit = {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    };

    const hasAuthHeader = !!token;
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Diagnostics logging (dev only)
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`[ApiClient] ${fetchOptions.method || 'GET'} ${endpoint}`, {
        hasAuthHeader,
        authHeaderLength: token ? token.length : 0,
      });
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Include cookies in all requests
    });

    let data: T | ApiErrorResponse;
    const text = await response.text();
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new ApiError('Invalid response from server', response.status);
    }

    // Diagnostics logging for 401 (dev only)
    if (isDev && response.status === 401) {
      console.warn(`[ApiClient] 401 Unauthorized on ${fetchOptions.method || 'GET'} ${endpoint}`, {
        hadAuthHeader: hasAuthHeader,
        responseMessage: (data as ApiErrorResponse).message || (data as ApiErrorResponse).error,
      });
    }

    // Handle 401 Unauthorized - attempt session revalidation and token refresh
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

      // Step 1: Attempt session revalidation by trying to refresh token
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        // No refresh token available - session is truly invalid
        // Don't auto-logout, just throw error with clear message
        if (isDev) {
          console.warn('[ApiClient] No refresh token available for 401 recovery');
        }
        const errorData = data as ApiErrorResponse;
        const message = Array.isArray(errorData.message) 
          ? errorData.message[0] 
          : errorData.message || errorData.error || 'Session expired. Please sign in again.';
        throw new ApiError(
          message,
          response.status,
          Array.isArray(errorData.message) ? errorData.message : undefined
        );
      }

      // Step 2: Attempt to refresh token
      if (isDev) {
        console.log('[ApiClient] Attempting token refresh after 401...');
      }
      const refreshSuccess = await this.attemptTokenRefresh();
      
      if (refreshSuccess) {
        if (isDev) {
          console.log('[ApiClient] Token refresh successful, retrying request...');
        }
        // Wait a bit to ensure token is available (store might need time to update)
        // Try multiple times to get the new token
        let newToken: string | null = null;
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          newToken = this.getToken();
          if (newToken) break;
        }

        if (!newToken) {
          // If we still don't have a token after refresh, try one more time with original token
          // This handles edge cases where refresh succeeded but token retrieval is delayed
          if (isDev) {
            console.warn('[ApiClient] Token not available after refresh, retrying request...');
          }
          // Retry with original options - the token might be available now
          return this.request<T>(endpoint, { ...options, skipAuthRefresh: true }, true);
        }
        
        // Retry the original request with new token
        return this.request<T>(endpoint, { ...options, skipAuthRefresh: true, token: newToken }, true);
      } else {
        // Refresh failed - session is truly expired/invalid
        // Don't auto-logout, just throw error with clear message
        if (isDev) {
          console.warn('[ApiClient] Token refresh failed after 401');
        }
        const errorData = data as ApiErrorResponse;
        const message = Array.isArray(errorData.message) 
          ? errorData.message[0] 
          : errorData.message || errorData.error || 'Session expired. Please sign in again.';
        throw new ApiError(
          message,
          response.status,
          Array.isArray(errorData.message) ? errorData.message : undefined
        );
      }
    }

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      let message: string;
      
      // Provide user-friendly messages for common errors
      if (response.status === 503) {
        message = 'Service is temporarily unavailable. Please try again later.';
      } else {
        message = Array.isArray(errorData.message) 
          ? errorData.message[0] 
          : errorData.message || errorData.error || 'An error occurred';
      }
      
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
   * Handles concurrent refresh requests by queuing them
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
          
          // Give a small delay to ensure store is updated
          if (success && typeof window !== 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify token is actually available after refresh
            const token = this.getToken();
            return !!token;
          }
          return success;
        })
        .catch((error) => {
          this.isRefreshing = false;
          this.refreshPromise = null;
          console.warn('Token refresh error:', error);
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
          credentials: 'include', // Include cookies in refresh request
        });

        if (!response.ok) {
          return false;
        }

        const newTokens = await response.json();
        
        // Update tokens in localStorage (fallback)
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('ilona-auth');
            if (stored) {
              const data = JSON.parse(stored);
              data.state.tokens = newTokens;
              localStorage.setItem('ilona-auth', JSON.stringify(data));
              // Verify token is actually available after update
              await new Promise(resolve => setTimeout(resolve, 50));
              const token = this.getToken();
              return !!token;
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
    // If body is FormData, pass it directly; otherwise stringify JSON
    const requestBody = body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined);
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: requestBody,
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

/**
 * Get API URL for file proxy
 * Converts R2 URLs to API proxy URLs to avoid CORS issues
 */
function getApiBaseUrl(): string {
  // If explicitly set in environment, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In browser, construct from current host
  if (typeof window !== 'undefined') {
    const host = window.location.host;
    const protocol = window.location.protocol;
    // If running on port 3000, assume API is on 4000
    // Otherwise, use same host and port
    if (host.includes(':3000')) {
      return `${protocol}//${host.split(':')[0]}:4000/api`;
    }
    // For production or custom ports, try same host with /api
    return `${protocol}//${host}/api`;
  }

  // Server-side fallback
  return 'http://localhost:4000/api';
}

/**
 * Convert a file URL to use the API proxy if it's an R2 URL
 * This avoids CORS issues when loading audio/video files from R2 storage
 */
export function getProxiedFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;

  // If it's already a local API URL, return as is
  if (fileUrl.startsWith('/api/') || fileUrl.includes('/api/storage/file/')) {
    return fileUrl;
  }

  // If it's a data URL, return as is
  if (fileUrl.startsWith('data:')) {
    return fileUrl;
  }

  // If it's an R2 URL (contains .r2.dev), proxy it through the API
  if (fileUrl.includes('.r2.dev')) {
    const apiBaseUrl = getApiBaseUrl();
    return `${apiBaseUrl}/storage/proxy?url=${encodeURIComponent(fileUrl)}`;
  }

  // If it's a localhost API URL but not using the proxy, check if it needs proxy
  // For files that might have CORS issues, use proxy
  try {
    const url = new URL(fileUrl);
    // If it's from a different origin and not our API, proxy it
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      if (url.origin !== currentOrigin && !url.origin.includes('localhost:4000')) {
        const apiBaseUrl = getApiBaseUrl();
        return `${apiBaseUrl}/storage/proxy?url=${encodeURIComponent(fileUrl)}`;
      }
    }
  } catch {
    // If URL parsing fails, return as is
  }

  // For all other URLs, return as is
  return fileUrl;
}