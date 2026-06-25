'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useAdminSidebarPreferencesStore } from '@/features/settings/store/admin-sidebar-preferences.store';
import {
  filterAdminNavEntries,
  getAdminNavEntries,
  type AdminNavEntry,
  type AdminNavLabelKey,
} from '@/shared/lib/admin-nav-entries';

const EMPTY_HIDDEN_KEYS: readonly AdminNavLabelKey[] = [];
const EMPTY_HIDDEN_SET: ReadonlySet<string> = new Set();

export function useAdminHiddenNavLabelKeysArray(): readonly AdminNavLabelKey[] {
  const userId = useAuthStore((state) => state.user?.id);
  const hiddenByUserId = useAdminSidebarPreferencesStore((state) => state.hiddenByUserId);

  return userId ? (hiddenByUserId[userId] ?? EMPTY_HIDDEN_KEYS) : EMPTY_HIDDEN_KEYS;
}

export function useAdminHiddenNavLabelKeys(): ReadonlySet<string> {
  const hiddenKeys = useAdminHiddenNavLabelKeysArray();

  return useMemo(() => {
    if (hiddenKeys.length === 0) return EMPTY_HIDDEN_SET;
    return new Set(hiddenKeys);
  }, [hiddenKeys]);
}

export function useAdminNavEntries(): AdminNavEntry[] {
  const role = useAuthStore((state) => state.user?.role ?? 'ADMIN');
  const hiddenKeys = useAdminHiddenNavLabelKeysArray();

  return useMemo(() => {
    const hiddenLabelKeys = hiddenKeys.length === 0 ? EMPTY_HIDDEN_SET : new Set(hiddenKeys);
    return filterAdminNavEntries(getAdminNavEntries(role), hiddenLabelKeys);
  }, [role, hiddenKeys]);
}
