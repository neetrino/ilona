'use client';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Session Expired Banner Component
 * Displays a non-blocking notification when session expires
 * User can dismiss it or navigate to login
 */
export function SessionExpiredBanner() {
  const { sessionExpired, clearSessionExpired } = useAuthStore();
  const router = useRouter();

  // Auto-dismiss after 10 seconds (optional)
  useEffect(() => {
    if (sessionExpired) {
      const timer = setTimeout(() => {
        clearSessionExpired();
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [sessionExpired, clearSessionExpired]);

  if (!sessionExpired) return null;

  const handleDismiss = () => {
    clearSessionExpired();
  };

  const handleLogin = () => {
    clearSessionExpired();
    router.push('/login');
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800 mb-1">Session Expired</h4>
            <p className="text-sm text-amber-700 mb-3">
              Your session has expired. Please log in again to continue.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-md hover:bg-amber-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
            aria-label="Dismiss"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

