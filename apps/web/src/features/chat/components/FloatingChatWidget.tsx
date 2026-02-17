'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChats } from '@/features/chat/hooks';
import { cn } from '@/shared/lib/utils';

export function FloatingChatWidget() {
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

  const handleChatClick = () => {
    if (!user?.role) return;

    // Get current pathname with search params as returnTo (includes locale)
    const currentPath = searchParams.toString() 
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    const returnTo = encodeURIComponent(currentPath);
    
    // Navigate to chat route with returnTo parameter
    const chatPath = `/${locale}/${user.role.toLowerCase()}/chat?returnTo=${returnTo}`;
    router.push(chatPath);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={handleChatClick}
        className={cn(
          'fixed z-50',
          'bottom-6 right-2',
          'w-14 h-14 sm:w-16 sm:h-16',
          'rounded-full',
          'bg-primary',
          'text-white shadow-lg shadow-primary/30',
          'flex items-center justify-center',
          'hover:shadow-xl hover:shadow-primary/40',
          'transition-all duration-200',
          'hover:scale-110 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'md:hover:scale-105'
        )}
        aria-label="Open chat"
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
              'absolute -top-1 -right-1',
              'min-w-[20px] h-5 px-1.5',
              'bg-red-500 text-white',
              'text-xs font-semibold',
              'rounded-full',
              'flex items-center justify-center',
              'border-2 border-white',
              'shadow-sm'
            )}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    </>
  );
}

