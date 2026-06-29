import { ApiError } from '../api-errors';
import type { ApiClientRefreshDeps, FetchOptions, QueuedRequest } from './api-client.types';

type ReplayRequest = <T>(endpoint: string, options: FetchOptions, isRetry?: boolean) => Promise<T>;

export class ApiClientRefreshCoordinator {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;
  private requestQueue: QueuedRequest<unknown>[] = [];
  private refreshFailed = false;

  constructor(private readonly deps: ApiClientRefreshDeps) {}

  get hasRefreshFailed(): boolean {
    return this.refreshFailed;
  }

  resetRefreshFailed() {
    this.refreshFailed = false;
  }

  markRefreshFailed() {
    this.refreshFailed = true;
  }

  isRefreshInFlight(): boolean {
    return this.isRefreshing;
  }

  enqueueRequest<T>(item: QueuedRequest<T>): void {
    this.requestQueue.push(item as QueuedRequest<unknown>);
  }

  async attemptTokenRefresh(replay: ReplayRequest): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }
    if (this.refreshFailed) {
      return false;
    }

    if (this.deps.getRefreshCallback()) {
      this.isRefreshing = true;
      this.refreshPromise = this.deps
        .getRefreshCallback()!()
        .then(async (success) => {
          if (success) {
            if (typeof window !== 'undefined') {
              await new Promise((resolve) => setTimeout(resolve, 100));
              if (this.deps.getToken()) {
                this.processRequestQueue(true, replay);
                this.isRefreshing = false;
                this.refreshPromise = null;
                return true;
              }
            }
          }

          if (this.refreshFailed) {
            this.deps.getSessionExpiredCallback()?.();
          }
          this.processRequestQueue(false, replay);
          this.isRefreshing = false;
          this.refreshPromise = null;
          return false;
        })
        .catch((error) => {
          console.warn('Token refresh error:', error);
          this.processRequestQueue(false, replay);
          this.isRefreshing = false;
          this.refreshPromise = null;
          return false;
        });
      return this.refreshPromise;
    }

    const refreshToken = this.deps.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.deps.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken }),
        });

        if (response.status === 401 || response.status === 403) {
          this.refreshFailed = true;
          this.processRequestQueue(false, replay);
          return false;
        }

        if (!response.ok) {
          this.processRequestQueue(false, replay);
          return false;
        }

        const newTokens = (await response.json()) as {
          accessToken?: string;
          refreshToken?: string;
        };

        if (
          typeof newTokens.accessToken === 'string' &&
          typeof newTokens.refreshToken === 'string'
        ) {
          const { applyRefreshedTokens } = await import('@/features/auth/store/auth.store');
          applyRefreshedTokens({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
          });
          await new Promise((resolve) => setTimeout(resolve, 50));
          if (this.deps.getToken()) {
            this.processRequestQueue(true, replay);
            return true;
          }
        }

        this.processRequestQueue(false, replay);
        return false;
      } catch {
        this.processRequestQueue(false, replay);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private processRequestQueue(refreshSuccess: boolean, replay: ReplayRequest) {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    if (refreshSuccess) {
      queue.forEach((queued) => {
        replay(queued.endpoint, queued.options).then(queued.resolve).catch(queued.reject);
      });
    } else {
      queue.forEach((queued) => {
        queued.reject(new ApiError('Session expired. Please log in again.', 401));
      });
    }
  }
}
