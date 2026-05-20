'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/shared/components/ui/button';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';

export default function HomePage() {
  const t = useTranslations('home');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const { data: logoData } = useLogo();
  const logoUrl = getFullApiUrl(logoData?.logoUrl) || '/logo.png';

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
    <div className="min-h-screen bg-slate-50/50">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href={`/home/${locale}`}
              className="flex items-center gap-3 transition-opacity hover:opacity-85"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform hover:scale-105 overflow-hidden bg-white relative">
                <Image
                  src={logoUrl}
                  alt="ILONA English Center"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                  unoptimized
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/logo.png';
                    target.onerror = null;
                  }}
                />
              </div>
              <span className="text-xl font-bold text-slate-900 hidden sm:inline tracking-tight">
                {t('title')}
              </span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <LanguageSwitcher />
              <Button asChild className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                <Link href={`/${locale}/login`}>{t('signIn')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
