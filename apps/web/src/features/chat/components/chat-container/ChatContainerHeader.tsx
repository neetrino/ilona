'use client';

import { useTranslations } from 'next-intl';
import { ChatBackButton } from '../ChatBackButton';
import { cn } from '@/shared/lib/utils';
import type { ChatContainerViewModel } from './chat-container.types';

interface ChatContainerHeaderProps {
  vm: ChatContainerViewModel;
}

export function ChatContainerHeader({ vm }: ChatContainerHeaderProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');
  const { ui, layout, activeChat, handleBackToPrevious } = vm;
  const { useAdminPortalLayout } = layout;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between border-b',
        useAdminPortalLayout
          ? 'border-[rgba(14,14,16,0.07)] bg-white px-3 py-3 sm:px-4'
          : cn('p-4', ui.border, ui.headerBg),
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
          'hidden items-center gap-2 px-4 py-2 transition-colors lg:flex',
          useAdminPortalLayout
            ? 'gap-1.5 rounded-[0.875rem] px-2 py-2 text-[#3b3b40] hover:text-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:ring-offset-2'
            : ui.backBtn,
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
        <span className={useAdminPortalLayout ? 'text-sm font-medium' : 'font-medium'}>
          {tCommon('back')}
        </span>
      </button>
      <h2
        className={cn(
          'font-bold',
          useAdminPortalLayout
            ? 'text-lg text-[#3b3b40] sm:text-xl'
            : cn('text-xl', ui.title),
        )}
      >
        {tChat('title')}
      </h2>
      {useAdminPortalLayout ? <div className="w-10" /> : <div className="w-20" />}
    </div>
  );
}
