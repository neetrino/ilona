'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { AboutSection, HeroSection, HomeNavigation } from '@/features/home/components';
import '@/features/home/styles/home.css';

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
    <div className="home-page min-h-screen bg-white">
      <div className="relative overflow-visible">
        <HomeNavigation overlay />
        <main className="overflow-visible">
          <HeroSection />
        </main>
      </div>
      <AboutSection />
    </div>
  );
}
