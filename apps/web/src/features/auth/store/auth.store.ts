'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/shared/lib/api';
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
        // Reset refresh failed state in API client
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

          // Update tokens while preserving user and authentication state
          set({ 
            tokens: newTokens,
            // Keep isAuthenticated true if we successfully refreshed
            isAuthenticated: true,
            sessionExpired: false, // Clear session expired state on successful refresh
          });
          return true;
        } catch (error) {
          // If refresh failed with 401/403, the refresh token is invalid/expired
          // Set session expired state but DON'T auto-logout (user can still interact)
          if (error instanceof Error && 'statusCode' in error && (error as any).statusCode === 401) {
            console.warn('Refresh token is invalid, session expired');
            set({ sessionExpired: true });
          } else if (error instanceof Error && 'statusCode' in error && (error as any).statusCode === 403) {
            console.warn('Refresh token is forbidden, session expired');
            set({ sessionExpired: true });
          } else {
            // For other errors (network issues), log but don't set session expired
            // Might be temporary network issue
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
        // Called when hydration is complete
        if (state) {
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
      return '/admin/dashboard';
    case 'TEACHER':
      return '/teacher/dashboard';
    case 'STUDENT':
      return '/student/dashboard';
    default:
      return '/';
  }
}

// Initialize API client with token refresh callback and token getters
// This should be called after the store is created (e.g., in QueryProvider)
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