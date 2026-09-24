'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { navigateToPortalNotifications } from '@/features/admin-dashboard/navigate-to-portal-notifications';
import { useNotificationUnreadCount } from './hooks';

export function NotificationBellButton() {
  const t = useTranslations('inbox');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = useAuthStore((state) => state.user?.role);
  const { data } = useNotificationUnreadCount();
  const unread = data?.unreadCount ?? 0;

  if (!role) {
    return null;
  }

  return (
    <button
      type="button"
      className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
      aria-label={t('title')}
      onClick={() =>
        navigateToPortalNotifications({
          router,
          locale,
          role,
          pathname,
          searchParams,
        })
      }
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unread > 0 ? (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
      ) : null}
    </button>
  );
}
