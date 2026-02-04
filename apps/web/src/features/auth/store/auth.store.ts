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
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
  setHydrated: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  tokens: null,
  isLoading: false,
  isAuthenticated: false,
  isHydrated: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

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
          });
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
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) {
          set({ ...initialState, isHydrated: true });
          return;
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

          set({ tokens: newTokens });
        } catch {
          set({ ...initialState, isHydrated: true });
          throw new Error('Token refresh failed');
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

// Initialize API client with token refresh callback
// This should be called after the store is created (e.g., in QueryProvider)
export function initializeApiClient() {
  if (typeof window === 'undefined') return;
  
  api.setRefreshCallback(async () => {
    try {
      const store = useAuthStore.getState();
      await store.refreshToken();
      return true;
    } catch {
      // If refresh fails, logout the user
      const store = useAuthStore.getState();
      store.logout();
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return false;
    }
  });
}