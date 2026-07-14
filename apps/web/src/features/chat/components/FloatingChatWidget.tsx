'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChats } from '@/features/chat/hooks';
import { cn } from '@/shared/lib/utils';
import { navigateToPortalChat } from '@/features/chat/lib/navigate-to-portal-chat';
import {
  isAdminPortalPath,
  isAdminPortalSubpage,
  isStudentPortalSubpage,
  isTeacherPortalSubpage,
} from '@/shared/lib/role-routes';

export function FloatingChatWidget() {
  const tChat = useTranslations('chat');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuthStore();
  
  // Fetch chats to calculate total unread count
  const { data: chats = [] } = useChats();
  
  // Calculate total unread messages across all conversations
  const totalUnread = useMemo(() => {
    return chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  }, [chats]);

  // Check if we're on a chat route - hide the button if so
  const isOnChatRoute = pathname.includes('/chat');
  if (isOnChatRoute) {
    return null;
  }

  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/');
  const isAdminRoute = isAdminPortalPath(pathWithoutLocale);
  const isPortalMobileSubpage =
    (user?.role === 'TEACHER' && isTeacherPortalSubpage(pathWithoutLocale)) ||
    (user?.role === 'STUDENT' && isStudentPortalSubpage(pathWithoutLocale)) ||
    ((user?.role === 'ADMIN' || user?.role === 'MANAGER') &&
      isAdminRoute &&
      isAdminPortalSubpage(pathWithoutLocale, user?.role));
  const isPortalShell =
    user?.role === 'STUDENT' ||
    user?.role === 'TEACHER' ||
    ((user?.role === 'ADMIN' || user?.role === 'MANAGER') && isAdminRoute);
  const fabBg = isPortalShell ? 'bg-[#1010a3]' : 'bg-primary';
  const fabShadow = isPortalShell
    ? 'shadow-lg shadow-[#1010a3]/25 hover:shadow-xl hover:shadow-[#1010a3]/35'
    : 'shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40';
  const fabFocus = isPortalShell
    ? 'focus:ring-[#1010a3] focus:ring-offset-2'
    : 'focus:ring-primary focus:ring-offset-2';

  const handleChatClick = () => {
    if (!user?.role) return;
    navigateToPortalChat({
      router,
      locale,
      role: user.role,
      pathname,
      searchParams,
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={handleChatClick}
        className={cn(
          'fixed z-50',
          'bottom-6 right-3 sm:right-6',
          isPortalMobileSubpage ? 'hidden lg:flex' : 'flex',
          'h-14 w-14 items-center justify-center sm:h-16 sm:w-16',
          'rounded-full text-white',
          fabBg,
          fabShadow,
          'transition-all duration-200',
          'hover:scale-110 active:scale-95',
          'focus:outline-none focus:ring-2',
          fabFocus,
          'md:hover:scale-105',
        )}
        aria-label={tChat('openChat')}
      >
        <svg
          className="w-6 h-6 sm:w-7 sm:h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {/* Unread Badge */}
        {totalUnread > 0 && (
          <span
            className={cn(
              'absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-[#1010a3] px-1.5 text-xs font-semibold text-white shadow-sm',
            )}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    </>
  );
}

