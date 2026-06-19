'use client';

import { useMemo, useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useChats } from '@/features/chat/hooks';
import { navigateToPortalChat } from '@/features/chat/lib/navigate-to-portal-chat';
import { navigateToPortalNotifications } from '@/features/admin-dashboard/navigate-to-portal-notifications';
import { PortalMobileSearchSheet } from '@/features/search/components/PortalMobileSearchSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath, isAdminPortalSubpage } from '@/shared/lib/role-routes';
import { ADMIN_PORTAL_MOBILE_HORIZONTAL_PADDING } from './admin-portal-layout';
import { cn } from '@/shared/lib/utils';

const BOTTOM_NAV_ICON_CLASS = 'h-[1.625rem] w-[1.625rem] stroke-[2]';
const ADMIN_PORTAL_CONTENT_SCROLL_ID = 'admin-portal-content-scroll';
const ADMIN_PORTAL_MOBILE_HEADER_ID = 'admin-portal-mobile-header';

function BottomNavItem({
  ariaLabel,
  label,
  labelClassName,
  onClick,
  href,
  children,
  badge,
}: {
  ariaLabel: string;
  label: string;
  labelClassName?: string;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
  badge?: number;
}) {
  const className =
    'relative z-0 flex min-w-0 flex-1 flex-col items-center justify-start gap-0 overflow-visible px-1.5 py-1 text-white outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none active:bg-transparent';

  const content = (
    <>
      <span className="relative z-0 flex h-9 w-9 shrink-0 items-center justify-center overflow-visible rounded-full">
        {children}
        {badge && badge > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 z-30 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff2e23] px-0.5 text-[9px] font-semibold leading-none text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'relative z-50 flex min-h-[13px] w-full items-center justify-center overflow-visible truncate px-0.5 text-center text-[11px] font-medium leading-snug',
          labelClassName,
        )}
      >
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-label={ariaLabel}>
      {content}
    </button>
  );
}

export function AdminPortalBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const tHome = useTranslations('home.nav');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tSettings = useTranslations('settings');
  const { user } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  const role = user?.role ?? 'ADMIN';
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/');
  const portalHomeHref = `/${locale}${getAdminPortalBasePath(role)}`;
  const isSubpage = isAdminPortalSubpage(pathWithoutLocale, role);
  const isOnChatRoute = pathname.includes('/chat');

  const { data: chats = [] } = useChats();
  const totalUnread = useMemo(
    () => chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0),
    [chats],
  );

  const scrollToAdminMobileHeader = () => {
    const header = document.getElementById(ADMIN_PORTAL_MOBILE_HEADER_ID);
    const contentScroller = document.getElementById(ADMIN_PORTAL_CONTENT_SCROLL_ID);

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    contentScroller?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    header?.scrollIntoView({ block: 'start', behavior: 'auto' });
  };

  const navigateToTop = (callback: () => void) => {
    callback();
    requestAnimationFrame(() => {
      scrollToAdminMobileHeader();
      requestAnimationFrame(scrollToAdminMobileHeader);
    });
  };

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  if (!isSubpage) {
    return null;
  }

  const handleChatClick = () => {
    if (!user?.role) return;
    navigateToTop(() => {
      navigateToPortalChat({
        router,
        locale,
        role: user.role,
        pathname,
        searchParams,
      });
    });
  };

  const handleNotificationsClick = () => {
    if (!user?.role) return;
    navigateToTop(() => {
      navigateToPortalNotifications({
        router,
        locale,
        role: user.role,
        pathname,
        searchParams,
      });
    });
  };

  return (
    <>
      <PortalMobileSearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        backdropClassName="z-[50]"
        containerClassName="z-[60]"
      />

      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-[65] overflow-visible rounded-t-[30px] bg-[#1010a3] lg:hidden',
          ADMIN_PORTAL_MOBILE_HORIZONTAL_PADDING,
          'pb-[env(safe-area-inset-bottom)]',
        )}
        aria-label={tNav('dashboard')}
      >
        <div className="relative z-[1] flex items-stretch overflow-visible pb-1.5 pt-1">
          <BottomNavItem
            ariaLabel={tHome('home')}
            label={tHome('home')}
            onClick={() =>
              navigateToTop(() => {
                router.push(portalHomeHref);
              })
            }
          >
            <svg className={BOTTOM_NAV_ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </BottomNavItem>

          <BottomNavItem
            ariaLabel={tCommon('globalSearch')}
            label={tCommon('search')}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <svg className={BOTTOM_NAV_ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </BottomNavItem>

          <BottomNavItem
            ariaLabel={tSettings('notifications')}
            label={tSettings('notifications')}
            onClick={handleNotificationsClick}
          >
            <svg className={BOTTOM_NAV_ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </BottomNavItem>

          {!isOnChatRoute ? (
            <BottomNavItem
              ariaLabel={tNav('chat')}
              label={tNav('chat')}
              onClick={handleChatClick}
              badge={totalUnread}
            >
              <svg className={BOTTOM_NAV_ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </BottomNavItem>
          ) : (
            <BottomNavItem ariaLabel={tNav('chat')} label={tNav('chat')}>
              <svg className={BOTTOM_NAV_ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </BottomNavItem>
          )}
        </div>
      </nav>
    </>
  );
}
