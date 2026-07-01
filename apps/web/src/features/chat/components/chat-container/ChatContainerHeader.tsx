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
      />
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
