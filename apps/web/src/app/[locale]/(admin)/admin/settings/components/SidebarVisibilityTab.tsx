'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useAdminSidebarPreferencesStore } from '@/features/settings/store/admin-sidebar-preferences.store';
import {
  ADMIN_NAV_SETTINGS_LABEL_KEY,
  getAdminNavEntries,
} from '@/shared/lib/admin-nav-entries';

export function SidebarVisibilityTab() {
  const t = useTranslations('settings');
  const tNav = useTranslations('nav');
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.user?.role ?? 'ADMIN');
  const toggleHidden = useAdminSidebarPreferencesStore((state) => state.toggleHidden);
  const isLabelHidden = useAdminSidebarPreferencesStore((state) => state.isLabelHidden);

  const hideableItems = getAdminNavEntries(role).filter(
    (item) => item.labelKey !== ADMIN_NAV_SETTINGS_LABEL_KEY,
  );

  return (
    <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
      <h2 className="mb-2 text-lg font-semibold text-[#3b3b40]">{t('sidebarVisibilityTitle')}</h2>
      <p className="mb-6 text-sm text-[#8b8b90]">{t('sidebarVisibilityDescription')}</p>

      <div className="space-y-0">
        {hideableItems.map((item, index) => {
          const hidden = isLabelHidden(userId, item.labelKey);
          const isLast = index === hideableItems.length - 1;

          return (
            <div
              key={item.labelKey}
              className={`flex items-center justify-between py-4 ${
                isLast ? '' : 'border-b border-[rgba(14,14,16,0.07)]'
              }`}
            >
              <div>
                <h3 className="font-medium text-[#3b3b40]">{tNav(item.labelKey)}</h3>
                <p className="text-sm text-[#8b8b90]">
                  {hidden ? t('sidebarItemHidden') : t('sidebarItemVisible')}
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={!hidden}
                  disabled={!userId}
                  onChange={() => {
                    if (!userId) return;
                    toggleHidden(userId, item.labelKey);
                  }}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-[#f1f1f2] after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-[#1010a3] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1010a3]/20 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 rtl:peer-checked:after:-translate-x-full" />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
