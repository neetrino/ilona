'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user, setHydrated } = useAuthStore();

  useEffect(() => {
    const finish = () => setHydrated();
    const unsub = useAuthStore.persist.onFinishHydration(finish);
    if (useAuthStore.persist.hasHydrated()) {
      finish();
    }
    const timer = window.setTimeout(finish, 1000);
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, [setHydrated]);

  useEffect(() => {
    // Wait for hydration before making any decisions
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace('/');
    } else if (user?.role !== 'TEACHER') {
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
  if (!isAuthenticated || user?.role !== 'TEACHER') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
