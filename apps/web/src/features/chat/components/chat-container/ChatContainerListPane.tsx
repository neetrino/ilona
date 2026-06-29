'use client';

import { ChatList } from '../ChatList';
import { StudentChatList } from '../StudentChatList';
import { TeacherChatList } from '../TeacherChatList';
import { cn } from '@/shared/lib/utils';
import type { ChatContainerViewModel } from './chat-container.types';

interface ChatContainerListPaneProps {
  vm: ChatContainerViewModel;
}

export function ChatContainerListPane({ vm }: ChatContainerListPaneProps) {
  const { ui, layout, isMobileListVisible, handleSelectChat } = vm;
  const { isStudent, isTeacher, useAdminPortalLayout } = layout;

  return (
    <div
      className={cn(
        useAdminPortalLayout
          ? 'flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white lg:w-80 lg:shrink-0 lg:flex-none lg:border-r lg:border-[rgba(14,14,16,0.07)]'
          : cn('w-full lg:w-80 border-r flex-shrink-0', ui.border),
        !isMobileListVisible && (useAdminPortalLayout ? 'hidden lg:flex' : 'hidden lg:block'),
      )}
    >
      {isStudent ? (
        <StudentChatList onSelectChat={handleSelectChat} />
      ) : isTeacher ? (
        <TeacherChatList onSelectChat={handleSelectChat} />
      ) : (
        <ChatList onSelectChat={handleSelectChat} />
      )}
    </div>
  );
}
