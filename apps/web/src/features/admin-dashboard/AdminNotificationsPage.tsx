'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';

export function AdminNotificationsPage() {
  const t = useTranslations('settings');

  return (
    <DashboardLayout title={t('notifications')}>
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1010a3]/10 text-[#1010a3]">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <p className="text-sm text-[#8b8b90]">{t('notificationsEmpty')}</p>
      </div>
    </DashboardLayout>
  );
}
