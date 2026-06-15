'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/shared/lib/api';
import { ApiError } from '@/shared/lib/api-errors';
import { isTokenExpired } from '@/shared/lib/jwt-utils';
import { clearChatStateOnLogout } from '@/features/chat/store/chat.store';
import {
  getAdminPortalBasePath,
  isPortalMobileViewport,
} from '@/shared/lib/role-routes';
import type { User, AuthTokens, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean; // Track if store is hydrated from localStorage
  error: string | null;
  sessionExpired: boolean; // Track if session has expired (non-blocking)
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: User) => void;
  setHydrated: () => void;
  setSessionExpired: (expired: boolean) => void;
  clearSessionExpired: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  tokens: null,
  isLoading: false,
  isAuthenticated: false,
  isHydrated: false,
  error: null,
  sessionExpired: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null, sessionExpired: false });

        try {
          const response = await api.post<{ user: User; tokens: AuthTokens }>('/auth/login', {
            email,
            password,
          });

          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            sessionExpired: false,
          });
          
          // Reset refresh failed state in API client
          api.resetRefreshFailed();
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      logout: () => {
        set({ ...initialState, isHydrated: true });
        clearChatStateOnLogout();
        api.resetRefreshFailed();
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) {
          // No refresh token available - set session expired (don't auto-logout)
          set({ sessionExpired: true });
          return false;
        }

        try {
          // Use skipAuthRefresh to avoid infinite loop
          const newTokens = await api.post<AuthTokens>(
            '/auth/refresh',
            {
              refreshToken: tokens.refreshToken,
            },
            { skipAuthRefresh: true }
          );

          applyRefreshedTokens(newTokens);
          return true;
        } catch (error) {
          if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
            console.warn('Refresh token is invalid, session expired');
            set({ ...initialState, isHydrated: true, sessionExpired: true });
            api.markRefreshFailed();
          } else {
            console.warn('Token refresh failed:', error);
          }
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setHydrated: () => {
        set({ isHydrated: true });
      },

      setSessionExpired: (expired: boolean) => {
        set({ sessionExpired: expired });
      },

      clearSessionExpired: () => {
        set({ sessionExpired: false });
      },
    }),
    {
      name: 'ilona-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const refresh = state.tokens?.refreshToken;
          if (refresh && isTokenExpired(refresh)) {
            state.logout();
          }
          state.setHydrated();
        }
      },
    }
  )
);

// Helper function to get the dashboard path based on role
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
    case 'MANAGER':
      return `${getAdminPortalBasePath(role)}/dashboard`;
    case 'TEACHER':
      return '/teacher/dashboard';
    case 'STUDENT':
      return '/student/dashboard';
    default:
      return '/';
  }
}

/** First screen after login — admin/manager mobile opens the portal home (/admin or /manager). */
export function getPortalEntryPath(role: UserRole): string {
  if (role === 'ADMIN' || role === 'MANAGER') {
    if (isPortalMobileViewport()) {
      return getAdminPortalBasePath(role);
    }
    return getDashboardPath(role);
  }
  return getDashboardPath(role);
}

/** Apply tokens from a successful refresh (keeps Zustand and localStorage in sync). */
export function applyRefreshedTokens(tokens: AuthTokens): void {
  useAuthStore.setState({
    tokens,
    isAuthenticated: true,
    sessionExpired: false,
  });
  api.resetRefreshFailed();
}

// Initialize API client with token refresh callback and token getters
export function initializeApiClient() {
  if (typeof window === 'undefined') return;
  
  // Set token getters to read directly from Zustand store
  // This ensures we always have the latest token state and avoids sync issues
  api.setTokenGetters(
    () => {
      const state = useAuthStore.getState();
      return state.tokens?.accessToken || null;
    },
    () => {
      const state = useAuthStore.getState();
      return state.tokens?.refreshToken || null;
    }
  );
  
  // Set refresh callback
  api.setRefreshCallback(async () => {
    try {
      const store = useAuthStore.getState();
      const success = await store.refreshToken();
      
      // Return the result - don't force logout
      // The API client will handle the failure appropriately
      return success;
    } catch (error) {
      // Log error but don't force logout
      console.warn('Token refresh callback error:', error);
      return false;
    }
  });
  
  // Set session expired callback (non-blocking notification)
  api.setSessionExpiredCallback(() => {
    const store = useAuthStore.getState();
    store.setSessionExpired(true);
  });
}

if (typeof window !== 'undefined') {
  initializeApiClient();
}