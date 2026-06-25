'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ADMIN_NAV_SETTINGS_LABEL_KEY,
  type AdminNavLabelKey,
} from '@/shared/lib/admin-nav-entries';

type HiddenByUserId = Record<string, AdminNavLabelKey[]>;

const EMPTY_HIDDEN_KEYS: AdminNavLabelKey[] = [];

interface AdminSidebarPreferencesState {
  hiddenByUserId: HiddenByUserId;
  isHydrated: boolean;
}

interface AdminSidebarPreferencesActions {
  setHydrated: () => void;
  toggleHidden: (userId: string, labelKey: AdminNavLabelKey) => void;
  getHiddenLabelKeys: (userId: string | undefined) => AdminNavLabelKey[];
  isLabelHidden: (userId: string | undefined, labelKey: AdminNavLabelKey) => boolean;
}

type AdminSidebarPreferencesStore = AdminSidebarPreferencesState & AdminSidebarPreferencesActions;

export const useAdminSidebarPreferencesStore = create<AdminSidebarPreferencesStore>()(
  persist(
    (set, get) => ({
      hiddenByUserId: {},
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),

      getHiddenLabelKeys: (userId) => {
        if (!userId) return EMPTY_HIDDEN_KEYS;
        return get().hiddenByUserId[userId] ?? EMPTY_HIDDEN_KEYS;
      },

      isLabelHidden: (userId, labelKey) => {
        if (!userId) return false;
        return (get().hiddenByUserId[userId] ?? EMPTY_HIDDEN_KEYS).includes(labelKey);
      },

      toggleHidden: (userId, labelKey) => {
        if (labelKey === ADMIN_NAV_SETTINGS_LABEL_KEY) return;

        const current = get().hiddenByUserId[userId] ?? EMPTY_HIDDEN_KEYS;
        const next = current.includes(labelKey)
          ? current.filter((key) => key !== labelKey)
          : [...current, labelKey];

        set({
          hiddenByUserId: {
            ...get().hiddenByUserId,
            [userId]: next,
          },
        });
      },
    }),
    {
      name: 'admin-sidebar-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ hiddenByUserId: state.hiddenByUserId }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
