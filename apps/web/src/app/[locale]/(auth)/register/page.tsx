'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { Button } from '@/shared/components/ui/button';

/**
 * Register (sign up) page.
 * This route must exist so that Next.js App Router RSC requests (e.g. /en/register?_rsc=...)
 * return 200 instead of 404. Account creation is handled by admins; this page directs
 * users to contact the center or sign in.
 */
export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (isAuthenticated && user) {
      router.replace(`/${locale}${getDashboardPath(user.role)}`);
    }
  }, [isAuthenticated, isHydrated, user, locale, router]);

  if (!isHydrated || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-background to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-background to-slate-100 p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:24px_24px] opacity-30" />
      <div className="relative z-10 w-full max-w-[480px] animate-in fade-in duration-500 rounded-2xl border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-center mb-2">{t('registerTitle')}</h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          {t('registerDescription')}
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href={`/${locale}/login`}>{t('login')}</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href={`/${locale}`}>{t('registerBackHome')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
