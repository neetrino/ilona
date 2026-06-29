/**
 * HTTP client with authentication, token refresh, and error handling.
 */

import { expiresWithin } from '../jwt-utils';
import { ApiError, type ApiErrorResponse } from '../api-errors';
import { ApiClientRefreshCoordinator } from './api-client-refresh';
import { generateRequestId, getCallsiteHint } from './api-client.util';
import { normalizeApiErrorMessage, resolveAccessToken, resolveRefreshToken } from './api-client-token.util';
import type {
  FetchOptions,
  RefreshTokenGetter,
  SessionExpiredCallback,
  TokenGetter,
  TokenRefreshCallback,
} from './api-client.types';

export class ApiClient {
  private baseUrl: string;
  private refreshCallback: TokenRefreshCallback | null = null;
  private sessionExpiredCallback: SessionExpiredCallback | null = null;
  private tokenGetter: TokenGetter | null = null;
  private refreshTokenGetter: RefreshTokenGetter | null = null;
  private readonly refreshCoordinator: ApiClientRefreshCoordinator;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.refreshCoordinator = new ApiClientRefreshCoordinator({
      baseUrl,
      getRefreshCallback: () => this.refreshCallback,
      getSessionExpiredCallback: () => this.sessionExpiredCallback,
      getToken: () => this.getToken(),
      getRefreshToken: () => this.getRefreshToken(),
    });
  }

  setRefreshCallback(callback: TokenRefreshCallback) {
    this.refreshCallback = callback;
  }

  setSessionExpiredCallback(callback: SessionExpiredCallback) {
    this.sessionExpiredCallback = callback;
  }

  setTokenGetters(tokenGetter: TokenGetter, refreshTokenGetter: RefreshTokenGetter) {
    this.tokenGetter = tokenGetter;
    this.refreshTokenGetter = refreshTokenGetter;
  }

  resetRefreshFailed() {
    this.refreshCoordinator.resetRefreshFailed();
  }

  markRefreshFailed() {
    this.refreshCoordinator.markRefreshFailed();
    this.sessionExpiredCallback?.();
  }

  private getToken(): string | null {
    return resolveAccessToken({
      tokenGetter: this.tokenGetter,
      refreshTokenGetter: this.refreshTokenGetter,
    });
  }

  private getRefreshToken(): string | null {
    return resolveRefreshToken({
      tokenGetter: this.tokenGetter,
      refreshTokenGetter: this.refreshTokenGetter,
    });
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {},
    isRetry = false,
  ): Promise<T> {
    const { token: explicitToken, skipAuthRefresh, retryCount: _retryCount = 0, ...fetchOptions } =
      options;

    if (
      this.refreshCoordinator.hasRefreshFailed &&
      !skipAuthRefresh &&
      !endpoint.startsWith('/auth/')
    ) {
      throw new ApiError('Session expired. Please log in again.', 401);
    }

    if (!skipAuthRefresh && !endpoint.startsWith('/auth/') && !isRetry) {
      const currentToken = explicitToken || this.getToken();
      if (currentToken && expiresWithin(currentToken, 60)) {
        const refreshToken = this.getRefreshToken();
        if (refreshToken && !this.refreshCoordinator.isRefreshInFlight()) {
          await this.refreshCoordinator.attemptTokenRefresh(this.request.bind(this));
        }
      }
    }

    const token = explicitToken || this.getToken();

    if (
      this.refreshCoordinator.isRefreshInFlight() &&
      !skipAuthRefresh &&
      !endpoint.startsWith('/auth/') &&
      !isRetry
    ) {
      return new Promise<T>((resolve, reject) => {
        this.refreshCoordinator.enqueueRequest({
          resolve: resolve as (value: unknown) => void,
          reject,
          endpoint,
          options,
        });
      });
    }

    const isFormData = fetchOptions.body instanceof FormData;
    const requestId = generateRequestId();
    const headers: HeadersInit = {
      'x-request-id': requestId,
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    };

    const hasAuthHeader = Boolean(token);
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      const route = `${fetchOptions.method || 'GET'} ${endpoint}`;
      const hint = getCallsiteHint();
      console.log('[ApiClient]', {
        key: route,
        url: endpoint,
        route,
        timestamp: new Date().toISOString(),
        requestId,
        ...(hint && { callsite: hint }),
      });
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });

    let data: T | ApiErrorResponse;
    const text = await response.text();

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new ApiError('Invalid response from server', response.status);
    }

    if (isDev && response.status === 401) {
      console.warn('[ApiClient] 401 Unauthorized', {
        method: fetchOptions.method || 'GET',
        endpoint,
        hadAuthHeader: hasAuthHeader,
        responseMessage: (data as ApiErrorResponse).message || (data as ApiErrorResponse).error,
      });
    }

    if (response.status === 401 && !skipAuthRefresh && !isRetry) {
      if (endpoint.startsWith('/auth/')) {
        const errorData = data as ApiErrorResponse;
        throw new ApiError(
          normalizeApiErrorMessage(errorData, response.status, 'Unauthorized'),
          response.status,
          Array.isArray(errorData.message) ? errorData.message : undefined,
        );
      }

      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        if (isDev) {
          console.warn('[ApiClient] No refresh token available for 401 recovery');
        }
        const errorData = data as ApiErrorResponse;
        throw new ApiError(
          normalizeApiErrorMessage(errorData, response.status, 'Session expired. Please sign in again.'),
          response.status,
          Array.isArray(errorData.message) ? errorData.message : undefined,
        );
      }

      if (isDev) {
        console.log('[ApiClient] Attempting token refresh after 401...');
      }
      const refreshSuccess = await this.refreshCoordinator.attemptTokenRefresh(
        this.request.bind(this),
      );

      if (refreshSuccess) {
        if (isDev) {
          console.log('[ApiClient] Token refresh successful, retrying request...');
        }
        let newToken: string | null = null;
        for (let i = 0; i < 5; i++) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          newToken = this.getToken();
          if (newToken) break;
        }

        if (!newToken) {
          if (isDev) {
            console.warn('[ApiClient] Token not available after refresh, retrying request...');
          }
          return this.request<T>(endpoint, { ...options, skipAuthRefresh: true }, true);
        }

        return this.request<T>(
          endpoint,
          { ...options, skipAuthRefresh: true, token: newToken },
          true,
        );
      }

      if (isDev) {
        console.warn('[ApiClient] Token refresh failed after 401');
      }
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        normalizeApiErrorMessage(errorData, response.status, 'Session expired. Please sign in again.'),
        response.status,
        Array.isArray(errorData.message) ? errorData.message : undefined,
      );
    }

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      const message = normalizeApiErrorMessage(errorData, response.status);
      throw new ApiError(
        message,
        response.status,
        Array.isArray(errorData.message) ? errorData.message : undefined,
      );
    }

    return data as T;
  }

  get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<T> {
    const requestBody = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: requestBody,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
