'use client';

import { useTranslations } from 'next-intl';
import { ChatBackButton } from '../ChatBackButton';
import { ADMIN_CHAT_EMPTY_PANE_BG_CLASS } from '../admin-chat-list/admin-chat-list.theme';
import { cn } from '@/shared/lib/utils';
import type { AdminChatContainerViewModel } from './admin-chat-container.types';

interface AdminChatContainerHeaderProps {
  vm: AdminChatContainerViewModel;
}

export function AdminChatContainerHeader({ vm }: AdminChatContainerHeaderProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');
  const { activeChat, handleBackToPrevious, setShowCreateGroupChatModal } = vm;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between border-b border-[rgba(14,14,16,0.07)] px-3 py-3 sm:px-4',
        activeChat ? 'bg-white' : ADMIN_CHAT_EMPTY_PANE_BG_CLASS,
        activeChat && 'max-lg:hidden',
      )}
    >
      <ChatBackButton
        onClick={handleBackToPrevious}
        aria-label={tChat('backToPreviousPage')}
        className="lg:hidden"
      />
      <button
        type="button"
        onClick={handleBackToPrevious}
        className={cn(
          'hidden items-center gap-1.5 rounded-[0.875rem] px-2 py-2 lg:flex',
          'text-[#3b3b40] transition-colors hover:text-[#1010a3]',
          'focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:ring-offset-2',
        )}
        aria-label={tChat('backToPreviousPage')}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span className="text-sm font-medium">{tCommon('back')}</span>
      </button>
      <h2 className="text-lg font-bold text-[#3b3b40] sm:text-xl">{tChat('title')}</h2>
      <button
        type="button"
        onClick={() => setShowCreateGroupChatModal(true)}
        className="rounded-full bg-[#1010a3] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1010a3]/90 sm:px-4 sm:text-sm"
      >
        {tChat('createGroupChat')}
      </button>
    </div>
  );
}
