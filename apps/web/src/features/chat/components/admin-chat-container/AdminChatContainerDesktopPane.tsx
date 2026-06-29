'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ChatWindow } from '../ChatWindow';
import { ChatEmptyState } from '../ChatEmptyState';
import type { AdminChatContainerViewModel } from './admin-chat-container.types';

interface AdminChatContainerDesktopPaneProps {
  vm: AdminChatContainerViewModel;
}

export function AdminChatContainerDesktopPane({ vm }: AdminChatContainerDesktopPaneProps) {
  const tChat = useTranslations('chat');
  const { activeChat, emptyTitle, emptyDescription, handleBack, setActiveChat } = vm;

  return (
    <div className={cn('hidden min-h-0 flex-1 flex-col overflow-hidden bg-white lg:flex')}>
      {activeChat ? (
        <ChatWindow chat={activeChat} onBack={handleBack} onChatUpdated={setActiveChat} />
      ) : (
        <ChatEmptyState
          title={emptyTitle || tChat('selectChat')}
          description={emptyDescription || tChat('selectChatDescription')}
          className="bg-white lg:bg-[#fafafa]"
        />
      )}
    </div>
  );
}
