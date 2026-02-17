import { expiresWithin } from './jwt-utils';

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
  retryCount?: number; // Internal: track retry attempts for exponential backoff
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

/**
 * Extract error message from unknown error type
 * Handles ApiError, Error, and unknown types safely
 */
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle axios-like error structure
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return typeof response.data.message === 'string' 
        ? response.data.message 
        : response.data.message[0] || fallback;
    }
  }
  
  // Handle error objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  
  return fallback;
}

type TokenRefreshCallback = () => Promise<boolean>;
type SessionExpiredCallback = () => void; // Called when refresh fails (non-blocking)
type TokenGetter = () => string | null;
type RefreshTokenGetter = () => string | null;

/**
 * Queued request that waits for token refresh to complete
 */
interface QueuedRequest<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  endpoint: string;
  options: FetchOptions;
}

class ApiClient {
  private baseUrl: string;
  private refreshCallback: TokenRefreshCallback | null = null;
  private sessionExpiredCallback: SessionExpiredCallback | null = null;
  private tokenGetter: TokenGetter | null = null;
  private refreshTokenGetter: RefreshTokenGetter | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;
  private requestQueue: QueuedRequest<unknown>[] = [];
  private refreshFailed = false; // Track if refresh has permanently failed

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
   * Set the session expired callback (non-blocking notification)
   * This should be called from the auth store after initialization
   */
  setSessionExpiredCallback(callback: SessionExpiredCallback) {
    this.sessionExpiredCallback = callback;
  }

  /**
   * Set token getters to read from Zustand store directly
   * This ensures we always have the latest token state
   */
  setTokenGetters(tokenGetter: TokenGetter, refreshTokenGetter: RefreshTokenGetter) {
    this.tokenGetter = tokenGetter;
    this.refreshTokenGetter = refreshTokenGetter;
  }

  /**
   * Reset refresh failed state (called after successful login)
   */
  resetRefreshFailed() {
    this.refreshFailed = false;
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

  /**
   * Calculate exponential backoff delay
   */
  private getBackoffDelay(retryCount: number): number {
    // Exponential backoff: 100ms, 200ms, 400ms, 800ms, max 2000ms
    return Math.min(100 * Math.pow(2, retryCount), 2000);
  }

  /**
   * Make HTTP request with retry logic and token refresh
   */
  private async request<T>(
    endpoint: string,
    options: FetchOptions = {},
    isRetry = false
  ): Promise<T> {
    const { token: explicitToken, skipAuthRefresh, retryCount: _retryCount = 0, ...fetchOptions } = options;
    
    // If refresh has permanently failed, don't retry
    if (this.refreshFailed && !skipAuthRefresh && !endpoint.startsWith('/auth/')) {
      const errorData: ApiErrorResponse = {
        message: 'Session expired. Please log in again.',
        statusCode: 401,
      };
      throw new ApiError(
        'Session expired. Please log in again.',
        401,
        Array.isArray(errorData.message) ? errorData.message : undefined
      );
    }

    // PROACTIVE REFRESH: Check if token expires within 60 seconds
    if (!skipAuthRefresh && !endpoint.startsWith('/auth/') && !isRetry) {
      const currentToken = explicitToken || this.getToken();
      if (currentToken && expiresWithin(currentToken, 60)) {
        // Token expires soon, refresh proactively
        const refreshToken = this.getRefreshToken();
        if (refreshToken && !this.isRefreshing) {
          await this.attemptTokenRefresh();
        }
      }
    }

    const token = explicitToken || this.getToken();

    // If we're currently refreshing and this is not a retry, queue the request
    if (this.isRefreshing && !skipAuthRefresh && !endpoint.startsWith('/auth/') && !isRetry) {
      return new Promise<T>((resolve, reject) => {
        this.requestQueue.push({
          resolve: resolve as (value: unknown) => void,
          reject,
          endpoint,
          options,
        });
      });
    }

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
   * Handles concurrent refresh requests with single-flight pattern (all wait for same refresh)
   */
  private async attemptTokenRefresh(): Promise<boolean> {
    // SINGLE-FLIGHT: If already refreshing, wait for the existing refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Prevent infinite loops: if refresh endpoint returns 401, don't retry
    if (this.refreshFailed) {
      return false;
    }

    // Use callback if available (preferred method)
    if (this.refreshCallback) {
      this.isRefreshing = true;
      this.refreshPromise = this.refreshCallback()
        .then(async (success) => {
          if (success) {
            // Give a small delay to ensure store is updated
            if (typeof window !== 'undefined') {
              await new Promise(resolve => setTimeout(resolve, 100));
              // Verify token is actually available after refresh
              const token = this.getToken();
              if (token) {
                // Process queued requests
                this.processRequestQueue(true);
                this.isRefreshing = false;
                this.refreshPromise = null;
                return true;
              }
            }
          }
          
          // Refresh failed or token not available
          this.processRequestQueue(false);
          this.isRefreshing = false;
          this.refreshPromise = null;
          return false;
        })
        .catch((error) => {
          console.warn('Token refresh error:', error);
          this.processRequestQueue(false);
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
          credentials: 'include',
          body: JSON.stringify({ refreshToken }),
        });

        // If refresh endpoint returns 401/403, refresh token is invalid - don't retry
        if (response.status === 401 || response.status === 403) {
          this.refreshFailed = true;
          this.processRequestQueue(false);
          return false;
        }

        if (!response.ok) {
          this.processRequestQueue(false);
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
              if (token) {
                this.processRequestQueue(true);
                return true;
              }
            }
          } catch {
            this.processRequestQueue(false);
            return false;
          }
        }

        this.processRequestQueue(false);
        return false;
      } catch {
        this.processRequestQueue(false);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Process queued requests after refresh completes
   */
  private processRequestQueue(refreshSuccess: boolean) {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    if (refreshSuccess) {
      // Replay all queued requests
      queue.forEach((queued) => {
        this.request(queued.endpoint, queued.options)
          .then(queued.resolve)
          .catch(queued.reject);
      });
    } else {
      // Reject all queued requests with session expired error
      queue.forEach((queued) => {
        queued.reject(
          new ApiError('Session expired. Please log in again.', 401)
        );
      });
    }
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