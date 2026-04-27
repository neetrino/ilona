'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { HomeHeader } from '@/shared/components/home/HomeHeader';
import { HomeLanding } from '@/shared/components/home/HomeLanding';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';

export default function HomePage() {
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();

  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      const dashboardPath = getDashboardPath(user.role);
      router.replace(`/${locale}${dashboardPath}`);
    }
  }, [isAuthenticated, isHydrated, user, locale, router]);

  if (!isHydrated || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 w-full">
        <HomeHeader />
      </div>
      <HomeLanding />
    </div>
  );
}
