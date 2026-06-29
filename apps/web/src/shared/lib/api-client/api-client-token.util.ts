import type { ApiErrorResponse } from '../api-errors';
import type { TokenReaderDeps } from './api-client.types';

function readTokenFromStorage(kind: 'accessToken' | 'refreshToken'): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('ilona-auth');
    if (stored) {
      const data = JSON.parse(stored) as {
        state?: { tokens?: { accessToken?: string; refreshToken?: string } };
      };
      return data?.state?.tokens?.[kind] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function resolveAccessToken(deps: TokenReaderDeps): string | null {
  if (deps.tokenGetter) {
    try {
      const token = deps.tokenGetter();
      if (token) return token;
    } catch {
      // Fallback to localStorage
    }
  }
  return readTokenFromStorage('accessToken');
}

export function resolveRefreshToken(deps: TokenReaderDeps): string | null {
  if (deps.refreshTokenGetter) {
    try {
      const token = deps.refreshTokenGetter();
      if (token) return token;
    } catch {
      // Fallback to localStorage
    }
  }
  return readTokenFromStorage('refreshToken');
}

export function normalizeApiErrorMessage(
  errorData: ApiErrorResponse,
  status: number,
  fallback = 'An error occurred',
): string {
  if (status === 503) {
    return 'Service is temporarily unavailable. Please try again later.';
  }
  return Array.isArray(errorData.message)
    ? errorData.message[0]
    : errorData.message || errorData.error || fallback;
}
