'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { StudentLogoutControl } from '@/shared/components/layout/StudentLogoutControl';
import { FloatingChatWidget } from '@/features/chat';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { getAdminNavEntries } from '@/shared/lib/admin-nav-entries';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';
import { PORTAL_SHELL_BG } from '@/shared/components/layout/student-layout';
import { AdminPortalNavCard } from './AdminPortalNavCard';
import { AdminPortalNavbar } from './AdminPortalNavbar';
import { ADMIN_PORTAL_MOBILE_HORIZONTAL_PADDING, ADMIN_PORTAL_MOBILE_NAV_OFFSET } from './admin-portal-layout';
import { cn } from '@/shared/lib/utils';

export function AdminPortalHomePage() {
  const router = useRouter();
  const locale = useLocale();
  const tNav = useTranslations('nav');
  const { user } = useAuthStore();
  const isLg = useIsLgViewport();
  const role = user?.role ?? 'ADMIN';

  const navItems = useMemo(() => getAdminNavEntries(role), [role]);

  useEffect(() => {
    if (isLg) {
      router.replace(getDashboardPath(role));
    }
  }, [isLg, role, router]);

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
        className={cn(ADMIN_PORTAL_MOBILE_HORIZONTAL_PADDING, 'pb-[max(1rem,env(safe-area-inset-bottom))]')}
        style={{ paddingTop: ADMIN_PORTAL_MOBILE_NAV_OFFSET }}
      >
        <div className="grid grid-cols-2 gap-3">
          {navItems.map((item) => (
            <AdminPortalNavCard
              key={item.href}
              href={`/${locale}${item.href}`}
              label={tNav(item.labelKey)}
              icon={item.icon}
            />
          ))}
        </div>

        <div className="mt-4 pb-2">
          <StudentLogoutControl variant="sidebar" />
        </div>
      </main>

      <FloatingChatWidget />
    </div>
  );
}
