'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FloatingChatWidget } from '@/features/chat';
import { AdminPortalNavCard } from '@/features/admin-dashboard/AdminPortalNavCard';
import { AdminPortalNavbar } from '@/features/admin-dashboard/AdminPortalNavbar';
import { getDashboardPath } from '@/features/auth/store/auth.store';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';
import { PORTAL_SHELL_BG } from '@/shared/components/layout/student-layout';
import {
  PORTAL_MOBILE_HORIZONTAL_PADDING,
  PORTAL_MOBILE_NAV_OFFSET,
} from '@/shared/lib/portal-mobile-layout';
import { getTeacherNavEntries } from '@/shared/lib/teacher-nav-entries';
import { cn } from '@/shared/lib/utils';

export function TeacherPortalHomePage() {
  const router = useRouter();
  const locale = useLocale();
  const tNav = useTranslations('nav');
  const isLg = useIsLgViewport();

  const navItems = getTeacherNavEntries();

  useEffect(() => {
    if (isLg) {
      router.replace(getDashboardPath('TEACHER'));
    }
  }, [isLg, router]);

  if (isLg === undefined || isLg) {
    return (
      <div className={cn('flex min-h-screen items-center justify-center', PORTAL_SHELL_BG)}>
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#f1f1f2] border-t-[#1010a3]" />
      </div>
    );
  }

  return (
    <div className={cn('min-h-[100dvh]', PORTAL_SHELL_BG)}>
      <AdminPortalNavbar />

      <main
        className={cn(PORTAL_MOBILE_HORIZONTAL_PADDING, 'pb-[max(1rem,env(safe-area-inset-bottom))]')}
        style={{ paddingTop: PORTAL_MOBILE_NAV_OFFSET }}
      >
        <div className="grid grid-cols-2 gap-3">
          {navItems.map((item) => (
            <AdminPortalNavCard
              key={item.href}
              href={`/${locale}${item.href}`}
              label={tNav(item.labelKey)}
              icon={{ type: 'sidebar', icon: item.icon }}
            />
          ))}
        </div>
      </main>

      <FloatingChatWidget />
    </div>
  );
}
