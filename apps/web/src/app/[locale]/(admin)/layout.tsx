'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { isAdminOnlyPathForManager } from '@/shared/lib/role-routes';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
  const isManager = user?.role === 'MANAGER';
  const isAdmin = user?.role === 'ADMIN';
  const isAdminPath = pathWithoutLocale.startsWith('/admin');
  const isManagerPath = pathWithoutLocale.startsWith('/manager');
  const managerPathFromAdmin = isAdminPath
    ? pathWithoutLocale.replace(/^\/admin/, '/manager')
    : '/manager/dashboard';
  const adminPathFromManager = isManagerPath
    ? pathWithoutLocale.replace(/^\/manager/, '/admin')
    : '/admin/dashboard';
  const isManagerRestrictedPath = isManager && isAdminOnlyPathForManager(pathWithoutLocale);

  useEffect(() => {
    // Wait for hydration before making any decisions
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace('/');
    } else if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
      router.replace('/');
    }
  }, [isAuthenticated, isHydrated, user, router]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;

    const search = typeof window !== 'undefined' ? window.location.search : '';

    if (isManager) {
      if (isManagerRestrictedPath) {
        router.replace(`/manager/dashboard${search}`);
        return;
      }

      if (isAdminPath) {
        router.replace(`${managerPathFromAdmin}${search}`);
      }
      return;
    }

    if (isAdmin && isManagerPath) {
      router.replace(`${adminPathFromManager}${search}`);
    }
  }, [isHydrated, isAuthenticated, isManager, isAdmin, router, isManagerRestrictedPath, isAdminPath, isManagerPath, managerPathFromAdmin, adminPathFromManager]);

  // Show loading while hydrating or checking auth
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#f1f1f2] border-t-[#1010a3]" />
      </div>
    );
  }

  // Show loading while redirecting
  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MANAGER')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#f1f1f2] border-t-[#1010a3]" />
      </div>
    );
  }

  // Block restricted manager routes from rendering while redirecting.
  if (isManagerRestrictedPath || (isManager && isAdminPath) || (isAdmin && isManagerPath)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#f1f1f2] border-t-[#1010a3]" />
      </div>
    );
  }

  return <>{children}</>;
}
