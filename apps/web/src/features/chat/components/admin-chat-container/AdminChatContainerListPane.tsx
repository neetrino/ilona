'use client';

import { cn } from '@/shared/lib/utils';
import { AdminChatList } from '../AdminChatList';
import { getAdminChatListPaneClass } from '../admin-chat-list/admin-chat-list.theme';
import type { AdminChatContainerViewModel } from './admin-chat-container.types';

interface AdminChatContainerListPaneProps {
  vm: AdminChatContainerViewModel;
}

export function AdminChatContainerListPane({ vm }: AdminChatContainerListPaneProps) {
  const { isMobileListVisible, activeChat, activeTab, handleTabChange, handleSelectChat } = vm;

  return (
    <div
      className={cn(getAdminChatListPaneClass(Boolean(activeChat)), !isMobileListVisible && 'hidden lg:flex')}
    >
      <AdminChatList
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSelectChat={handleSelectChat}
        hasActiveChat={Boolean(activeChat)}
      />
    </div>
  );
}
