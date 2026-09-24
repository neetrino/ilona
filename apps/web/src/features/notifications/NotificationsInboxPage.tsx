'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { cn } from '@/shared/lib/utils';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsInbox,
} from './hooks';
import { notificationHref } from './notification-href';

type InboxLayoutVariant = 'default' | 'student' | 'teacher' | 'admin';

export function NotificationsInboxPage({ variant = 'admin' }: { variant?: InboxLayoutVariant }) {
  const t = useTranslations('inbox');
  const locale = useLocale();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const { data, isLoading } = useNotificationsInbox();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const items = data?.items ?? [];

  return (
    <DashboardLayout title={t('title')} variant={variant}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[#8b8b90]">
          {t('unreadCount', { count: data?.unreadCount ?? 0 })}
        </p>
        {items.some((item) => !item.isRead) ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            {t('markAllRead')}
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('empty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const href = notificationHref(item, locale, role);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    'w-full rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white p-4 text-left',
                    !item.isRead && 'border-[#1010a3]/30 bg-[#1010a3]/5',
                  )}
                  onClick={() => {
                    if (!item.isRead) {
                      markRead.mutate(item.id);
                    }
                    if (href) {
                      router.push(href);
                    }
                  }}
                >
                  <p className="font-medium text-[#3b3b40]">{item.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-[#8b8b90]">{item.content}</p>
                  <p className="mt-2 text-xs text-[#8b8b90]">
                    {new Date(item.createdAt).toLocaleString(locale)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardLayout>
  );
}
