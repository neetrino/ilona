'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { cn } from '@/shared/lib/utils';
import { portalPageStackClass } from '@/shared/lib/portal-responsive';
import { NotificationInboxItem } from './NotificationInboxItem';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsInbox,
} from './hooks';
import { notificationHref } from './notification-href';

type InboxLayoutVariant = 'default' | 'student' | 'teacher' | 'admin';
type InboxFilter = 'unread' | 'all';

export function NotificationsInboxPage({ variant = 'admin' }: { variant?: InboxLayoutVariant }) {
  const t = useTranslations('inbox');
  const locale = useLocale();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const { data, isLoading } = useNotificationsInbox();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const [filter, setFilter] = useState<InboxFilter>('all');
  const visible = useMemo(
    () => (filter === 'unread' ? items.filter((item) => !item.isRead) : items),
    [filter, items],
  );

  return (
    <DashboardLayout title={t('title')} variant={variant}>
      <div className={portalPageStackClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#8b8b90]">{t('unreadCount', { count: unreadCount })}</p>
          <div className="flex flex-wrap items-center gap-2">
            {(['unread', 'all'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  filter === value ? 'bg-[#1010a3] text-white' : 'bg-[#f6f6f7] text-[#5b5b62]',
                )}
              >
                {t(value)}
              </button>
            ))}
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="rounded-full border border-[rgba(14,14,16,0.07)] bg-white px-3.5 py-1.5 text-sm font-medium text-[#3b3b40] hover:bg-[#fafafa] disabled:opacity-50"
              >
                {t('markAllRead')}
              </button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white py-16">
            <LoadingSpinner size="md" />
            <p className="mt-3 text-sm text-[#8b8b90]">{t('loading')}</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white px-6 py-16 text-center">
            <p className="text-base font-semibold text-[#1010a3]">
              {filter === 'unread' && items.length > 0 ? t('caughtUp') : t('empty')}
            </p>
            <p className="mt-2 text-sm text-[#8b8b90]">
              {filter === 'unread' && items.length > 0 ? t('caughtUpHint') : t('emptyHint')}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((item) => (
              <NotificationInboxItem
                key={item.id}
                item={item}
                locale={locale}
                onOpen={(opened) => {
                  if (!opened.isRead) {
                    markRead.mutate(opened.id);
                  }
                  const href = notificationHref(opened, locale, role);
                  if (href) {
                    router.push(href);
                  }
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
