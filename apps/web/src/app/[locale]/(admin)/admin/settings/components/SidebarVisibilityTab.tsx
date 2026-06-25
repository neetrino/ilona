'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useAdminSidebarPreferencesStore } from '@/features/settings/store/admin-sidebar-preferences.store';
import {
  ADMIN_NAV_SETTINGS_LABEL_KEY,
  getAdminNavEntries,
  type AdminNavLabelKey,
} from '@/shared/lib/admin-nav-entries';
import { cn } from '@/shared/lib/utils';
import { SidebarVisibilityConfirmDialog } from './SidebarVisibilityConfirmDialog';

type PendingVisibilityChange = {
  labelKey: AdminNavLabelKey;
  sectionLabel: string;
  action: 'activate' | 'deactivate';
};

export function SidebarVisibilityTab() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.user?.role ?? 'ADMIN');
  const toggleHidden = useAdminSidebarPreferencesStore((state) => state.toggleHidden);
  const isLabelHidden = useAdminSidebarPreferencesStore((state) => state.isLabelHidden);
  const [pendingChange, setPendingChange] = useState<PendingVisibilityChange | null>(null);

  const hideableItems = getAdminNavEntries(role).filter(
    (item) => item.labelKey !== ADMIN_NAV_SETTINGS_LABEL_KEY,
  );

  const handleVisibilityChange = (
    labelKey: AdminNavLabelKey,
    sectionLabel: string,
    willBeActive: boolean,
  ) => {
    if (!userId) return;

    setPendingChange({
      labelKey,
      sectionLabel,
      action: willBeActive ? 'activate' : 'deactivate',
    });
  };

  const handleConfirmChange = () => {
    if (!userId || !pendingChange) return;
    toggleHidden(userId, pendingChange.labelKey);
    setPendingChange(null);
  };

  const isDeactivate = pendingChange?.action === 'deactivate';

  return (
    <>
      <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold text-[#3b3b40]">{t('sidebarVisibilityTitle')}</h2>
        <p className="mb-6 text-sm text-[#8b8b90]">{t('sidebarVisibilityDescription')}</p>

        <div className="space-y-0">
          {hideableItems.map((item, index) => {
            const inactive = isLabelHidden(userId, item.labelKey);
            const isLast = index === hideableItems.length - 1;
            const sectionLabel = tNav(item.labelKey);

            return (
              <div
                key={item.labelKey}
                className={cn(
                  'flex items-center justify-between py-4',
                  !isLast && 'border-b border-[rgba(14,14,16,0.07)]',
                )}
              >
                <div>
                  <h3 className="font-medium text-[#3b3b40]">{sectionLabel}</h3>
                  <p className="text-sm text-[#8b8b90]">
                    {inactive ? t('sidebarItemInactive') : t('sidebarItemActive')}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!inactive}
                  aria-label={sectionLabel}
                  disabled={!userId}
                  onClick={() => handleVisibilityChange(item.labelKey, sectionLabel, inactive)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-[#1010a3]/20 disabled:cursor-not-allowed disabled:opacity-50',
                    !inactive ? 'bg-[#1010a3]' : 'bg-[#f1f1f2]',
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 rounded-full border border-gray-300 bg-white transition-transform',
                      !inactive ? 'translate-x-5 border-white' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <SidebarVisibilityConfirmDialog
        open={pendingChange !== null}
        onOpenChange={(open) => {
          if (!open) setPendingChange(null);
        }}
        onConfirm={handleConfirmChange}
        title={
          isDeactivate ? t('sidebarHideConfirmTitle') : t('sidebarActivateConfirmTitle')
        }
        description={t(
          isDeactivate ? 'sidebarHideConfirmDescription' : 'sidebarActivateConfirmDescription',
          { section: pendingChange?.sectionLabel ?? '' },
        )}
        confirmLabel={
          isDeactivate ? t('sidebarHideConfirmAction') : t('sidebarActivateConfirmAction')
        }
        cancelLabel={tCommon('cancel')}
        confirmVariant={isDeactivate ? 'destructive' : 'default'}
      />
    </>
  );
}
