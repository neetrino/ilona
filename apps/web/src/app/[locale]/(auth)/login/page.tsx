'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!isHydrated) return;

    // If already authenticated, redirect to dashboard
    if (isAuthenticated && user) {
      router.replace(getDashboardPath(user.role));
    }
  }, [isAuthenticated, isHydrated, user, router]);

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-background to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-background to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-background to-slate-100 p-4 sm:p-6">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:24px_24px] opacity-30" />
      
      <div className="relative z-10 w-full max-w-[480px] animate-in fade-in duration-500">
        <LoginForm />
      </div>
    </div>
  );
}
