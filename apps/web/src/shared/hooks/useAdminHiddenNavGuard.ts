'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useAdminSidebarPreferencesStore } from '@/features/settings/store/admin-sidebar-preferences.store';
import {
  ADMIN_NAV_SETTINGS_LABEL_KEY,
  resolveAdminNavLabelKeyFromPath,
} from '@/shared/lib/admin-nav-entries';
import { useAdminHiddenNavLabelKeysArray } from '@/shared/hooks/useAdminNavEntries';
import { stripLocaleFromPath } from '@/shared/lib/role-routes';

type AdminHiddenNavGuardState = {
  isBlocked: boolean;
  isChecking: boolean;
};

export function useAdminHiddenNavGuard(): AdminHiddenNavGuardState {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const preferencesHydrated = useAdminSidebarPreferencesStore((state) => state.isHydrated);
  const hiddenKeys = useAdminHiddenNavLabelKeysArray();

  const isAdmin = user?.role === 'ADMIN';
  const pathWithoutLocale = stripLocaleFromPath(pathname);
  const matchedLabelKey = isAdmin
    ? resolveAdminNavLabelKeyFromPath(pathWithoutLocale, user.role)
    : null;

  const isCandidatePath =
    isAdmin &&
    matchedLabelKey !== null &&
    matchedLabelKey !== ADMIN_NAV_SETTINGS_LABEL_KEY;

  const isChecking = isCandidatePath && !preferencesHydrated;
  const isBlocked =
    isCandidatePath && preferencesHydrated && hiddenKeys.includes(matchedLabelKey);

  return { isBlocked, isChecking };
}
