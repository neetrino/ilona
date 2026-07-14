'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { useAdminChatList } from './admin-chat-list/useAdminChatList';
import { AdminChatListTabBar } from './admin-chat-list/AdminChatListTabBar';
import { AdminChatListSearch } from './admin-chat-list/AdminChatListSearch';
import { AdminChatListEmptyState } from './admin-chat-list/AdminChatListEmptyState';
import { AdminChatListStudentItems } from './admin-chat-list/AdminChatListStudentItems';
import { AdminChatListTeacherItems } from './admin-chat-list/AdminChatListTeacherItems';
import { AdminChatListGroupItems } from './admin-chat-list/AdminChatListGroupItems';
import { TeacherChatListLoadingSkeleton } from './teacher-chat-list/TeacherChatListLoadingSkeleton';
import { ChatEmptyState } from './ChatEmptyState';
import { ADMIN_CHAT_EMPTY_PANE_BG_CLASS } from './admin-chat-list/admin-chat-list.theme';
import type { AdminChatListProps } from './admin-chat-list/admin-chat-list.types';

export type { AdminChatListProps } from './admin-chat-list/admin-chat-list.types';

export function AdminChatList(props: AdminChatListProps) {
  const tChat = useTranslations('chat');
  const vm = useAdminChatList(props);
  const paneBgClass = props.hasActiveChat ? 'bg-white' : ADMIN_CHAT_EMPTY_PANE_BG_CLASS;

  const renderListContent = () => {
    if (vm.isLoading) {
      return <TeacherChatListLoadingSkeleton />;
    }
    if (!vm.hasData && vm.activeTab) {
      return <AdminChatListEmptyState activeTab={vm.activeTab} searchQuery={vm.searchQuery} />;
    }
    if (vm.activeTab === 'students') {
      return (
        <AdminChatListStudentItems
          students={vm.sortedStudents}
          activeChat={vm.activeChat}
          getUserUnreadCount={vm.getUserUnreadCount}
          getUserOnlineStatus={vm.getUserOnlineStatus}
          getUserLastMessage={vm.getUserLastMessage}
          onSelectUser={vm.handleSelectUser}
        />
      );
    }
    if (vm.activeTab === 'teachers') {
      return (
        <AdminChatListTeacherItems
          teachers={vm.sortedTeachers}
          activeChat={vm.activeChat}
          getUserUnreadCount={vm.getUserUnreadCount}
          getUserOnlineStatus={vm.getUserOnlineStatus}
          getUserLastMessage={vm.getUserLastMessage}
          onSelectUser={vm.handleSelectUser}
        />
      );
    }
    if (vm.activeTab === 'groups') {
      return (
        <AdminChatListGroupItems
          items={vm.sortedGroupItems}
          groupUnreadMap={vm.groupUnreadMap}
          activeChat={vm.activeChat}
          getGroupLastMessage={vm.getGroupLastMessage}
          onSelectChat={vm.onSelectChat}
          onSelectGroup={vm.handleSelectGroup}
        />
      );
    }
    return null;
  };

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', paneBgClass)}>
      {!vm.activeTab ? (
        <>
          <div
            className={cn(
              'shrink-0 overflow-x-hidden border-b border-[rgba(14,14,16,0.07)] px-3 py-3',
              paneBgClass,
            )}
          >
            <AdminChatListTabBar
              activeTab={vm.activeTab}
              unreadCounts={vm.unreadCounts}
              onTabChange={vm.onTabChange}
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <ChatEmptyState
              title={tChat('selectCategory')}
              description={tChat('selectCategoryDescription')}
            />
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [touch-action:pan-y] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className={cn('sticky top-0 z-20', paneBgClass)}>
            <div
              className={cn(
                'overflow-x-hidden border-b border-[rgba(14,14,16,0.07)] px-3 py-3 sm:px-3',
                paneBgClass,
              )}
            >
              <AdminChatListTabBar
                activeTab={vm.activeTab}
                unreadCounts={vm.unreadCounts}
                onTabChange={vm.onTabChange}
              />
            </div>
            <div className="border-b border-[rgba(14,14,16,0.07)] px-3 pb-3 pt-2">
              <AdminChatListSearch
                activeTab={vm.activeTab}
                tabLabels={vm.tabLabels}
                searchQuery={vm.searchQuery}
                onSearchChange={vm.setSearchQuery}
              />
            </div>
          </div>
          {renderListContent()}
        </div>
      )}
    </div>
  );
}
