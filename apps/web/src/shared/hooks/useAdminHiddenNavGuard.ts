'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useAdminSidebarPreferencesStore } from '@/features/settings/store/admin-sidebar-preferences.store';
import {
  ADMIN_NAV_SETTINGS_LABEL_KEY,
  getFirstVisibleAdminNavHref,
  resolveAdminNavLabelKeyFromPath,
} from '@/shared/lib/admin-nav-entries';
import { useAdminHiddenNavLabelKeysArray } from '@/shared/hooks/useAdminNavEntries';

export function useAdminHiddenNavGuard(): boolean {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const user = useAuthStore((state) => state.user);
  const preferencesHydrated = useAdminSidebarPreferencesStore((state) => state.isHydrated);
  const hiddenKeys = useAdminHiddenNavLabelKeysArray();

  const isAdmin = user?.role === 'ADMIN';
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || pathname;
  const matchedLabelKey = isAdmin
    ? resolveAdminNavLabelKeyFromPath(pathWithoutLocale, user.role)
    : null;

  const isBlocked =
    isAdmin &&
    preferencesHydrated &&
    matchedLabelKey !== null &&
    matchedLabelKey !== ADMIN_NAV_SETTINGS_LABEL_KEY &&
    hiddenKeys.includes(matchedLabelKey);

  useEffect(() => {
    if (!isBlocked || !user) return;

    const hiddenLabelKeys = hiddenKeys.length === 0 ? new Set<string>() : new Set(hiddenKeys);
    const fallbackHref = getFirstVisibleAdminNavHref(user.role, hiddenLabelKeys);
    router.replace(`/${locale}${fallbackHref}`);
  }, [isBlocked, user, hiddenKeys, router, locale]);

  return isBlocked;
}
