'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function TeacherLayout({
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
    } else if (user?.role !== 'TEACHER') {
      router.replace('/');
    }
  }, [isAuthenticated, isHydrated, user, router]);

  // Show loading while hydrating or checking auth
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#f1f1f2] border-t-[#1010a3]" />
      </div>
    );
  }

  // Show loading while redirecting
  if (!isAuthenticated || user?.role !== 'TEACHER') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#f1f1f2] border-t-[#1010a3]" />
      </div>
    );
  }

  return <>{children}</>;
}
