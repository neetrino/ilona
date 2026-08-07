'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();

  useEffect(() => {
    // Wait for hydration before making any decisions
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace('/');
    } else if (user?.role !== 'STUDENT') {
      router.replace('/');
    }
  }, [isAuthenticated, isHydrated, user, router]);

  // Show loading while hydrating or checking auth
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show loading while redirecting
  if (!isAuthenticated || user?.role !== 'STUDENT') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
