'use client';

import { useTeacherChatList } from './teacher-chat-list/useTeacherChatList';
import { TeacherChatListTabBar } from './teacher-chat-list/TeacherChatListTabBar';
import { TeacherChatListSearch } from './teacher-chat-list/TeacherChatListSearch';
import { TeacherChatListLoadingSkeleton } from './teacher-chat-list/TeacherChatListLoadingSkeleton';
import { TeacherChatListEmptyState } from './teacher-chat-list/TeacherChatListEmptyState';
import { TeacherChatListAdminItem } from './teacher-chat-list/TeacherChatListAdminItem';
import { TeacherChatListGroupItems } from './teacher-chat-list/TeacherChatListGroupItems';
import { TeacherChatListStudentItems } from './teacher-chat-list/TeacherChatListStudentItems';
import type { TeacherChatListProps } from './teacher-chat-list/teacher-chat-list.types';

export type { TeacherChatListProps } from './teacher-chat-list/teacher-chat-list.types';

export function TeacherChatList(props: TeacherChatListProps) {
  const vm = useTeacherChatList(props);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [touch-action:pan-y]">
        <div className="sticky top-0 z-20 bg-white">
          <div className="overflow-x-hidden border-b border-[rgba(14,14,16,0.07)] px-3 py-3">
            <TeacherChatListTabBar
              activeTab={vm.activeTab}
              unreadCounts={vm.unreadCounts}
              onTabChange={vm.setActiveTab}
            />
          </div>
          <div className="border-b border-[rgba(14,14,16,0.07)] px-3 pb-3 pt-2">
            <TeacherChatListSearch
              activeTab={vm.activeTab}
              searchQuery={vm.searchQuery}
              onSearchChange={vm.setSearchQuery}
            />
          </div>
        </div>

        <div>
          {vm.isLoading ? (
            <TeacherChatListLoadingSkeleton />
          ) : !vm.hasData ? (
            <TeacherChatListEmptyState activeTab={vm.activeTab} searchQuery={vm.searchQuery} />
          ) : vm.activeTab === 'admin' ? (
            vm.admin ? (
              <TeacherChatListAdminItem
                admin={vm.admin}
                activeChat={vm.activeChat}
                createDirectChatPending={vm.createDirectChatPending}
                messagePreviewLabels={vm.messagePreviewLabels}
                formatTime={vm.formatTime}
                onAdminClick={vm.handleAdminClick}
              />
            ) : null
          ) : vm.activeTab === 'groups' ? (
            <TeacherChatListGroupItems
              items={vm.sortedGroupItems}
              allChats={vm.allChats}
              activeChat={vm.activeChat}
              messagePreviewLabels={vm.messagePreviewLabels}
              formatTime={vm.formatTime}
              onSelectChat={vm.onSelectChat}
              onGroupClick={vm.handleGroupClick}
            />
          ) : (
            <TeacherChatListStudentItems
              students={vm.sortedStudents}
              activeChat={vm.activeChat}
              createDirectChatPending={vm.createDirectChatPending}
              messagePreviewLabels={vm.messagePreviewLabels}
              formatTime={vm.formatTime}
              isUserOnline={vm.isUserOnline}
              onStudentClick={vm.handleStudentClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
