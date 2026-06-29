'use client';

import { useTranslations } from 'next-intl';
import { ChatWindow } from '../ChatWindow';
import { ChatEmptyState } from '../ChatEmptyState';
import { cn } from '@/shared/lib/utils';
import type { ChatContainerViewModel } from './chat-container.types';

interface ChatContainerDesktopPaneProps {
  vm: ChatContainerViewModel;
}

export function ChatContainerDesktopPane({ vm }: ChatContainerDesktopPaneProps) {
  const tChat = useTranslations('chat');
  const { ui, layout, activeChat, emptyTitle, emptyDescription, handleBack, setActiveChat } = vm;
  const { useAdminPortalLayout } = layout;

  if (activeChat) {
    return (
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden bg-white lg:flex">
        <ChatWindow chat={activeChat} onBack={handleBack} onChatUpdated={setActiveChat} />
      </div>
    );
  }

  if (useAdminPortalLayout) {
    return (
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden bg-white lg:flex">
        <ChatEmptyState
          title={emptyTitle || tChat('selectChat')}
          description={emptyDescription || tChat('selectChatDescription')}
          className="bg-white lg:bg-[#fafafa]"
        />
      </div>
    );
  }

  return (
    <div className="hidden min-h-0 flex-1 flex-col overflow-hidden bg-white lg:flex">
      <div className={cn('flex flex-1 items-center justify-center', ui.messagesBg)}>
        <div className="text-center">
          <div
            className={cn(
              'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
              ui.emptyIcon,
            )}
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className={cn('mb-1 text-lg font-semibold', ui.title)}>
            {emptyTitle || tChat('selectChat')}
          </h3>
          <p className={cn('text-sm', ui.muted)}>
            {emptyDescription || tChat('selectChatDescription')}
          </p>
        </div>
      </div>
    </div>
  );
}
