'use client';

import { cn } from '@/shared/lib/utils';
import { AdminChatList } from '../AdminChatList';
import type { AdminChatContainerViewModel } from './admin-chat-container.types';

interface AdminChatContainerListPaneProps {
  vm: AdminChatContainerViewModel;
}

export function AdminChatContainerListPane({ vm }: AdminChatContainerListPaneProps) {
  const { isMobileListVisible, activeTab, handleTabChange, handleSelectChat } = vm;

  return (
    <div
      className={cn(
        'flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white lg:w-80 lg:shrink-0 lg:flex-none lg:border-r lg:border-[rgba(14,14,16,0.07)]',
        !isMobileListVisible && 'hidden lg:flex',
      )}
    >
      <AdminChatList
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSelectChat={handleSelectChat}
      />
    </div>
  );
}
