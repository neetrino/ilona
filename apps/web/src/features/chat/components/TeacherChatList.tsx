'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useTeacherGroups, useTeacherStudents, useTeacherAdmin, useSocket, useCreateDirectChat, useTeacherUnreadCounts, useCustomGroupChats, useChats } from '../hooks';
import { fetchGroupChat } from '../api/chat.api';
import { useChatStore } from '../store/chat.store';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';
import { ApiError } from '@/shared/lib/api';
import { formatMessagePreview } from '../utils';
import { formatChatListTime, sortChatListItems, type ChatListSortable } from '../utils/chat-utils';
import { Badge } from '@/shared/components/ui/badge';
import Image from 'next/image';
import { formatDisplayName, getInitialsFromParts } from '@/shared/components/ui/avatar';
import { getGroupIconComponent } from '@/features/groups';
import { OnlineStatusDot } from './OnlineStatusDot';

interface TeacherChatListProps {
  onSelectChat: (chat: Chat) => void;
}

export function TeacherChatList({ onSelectChat }: TeacherChatListProps) {
  const tChat = useTranslations('chat');
  const locale = useLocale();
  const { user: _user } = useAuthStore();
  const { activeChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'admin' | 'groups' | 'students'>('groups');

  const messagePreviewLabels = useMemo(
    () => ({
      noMessagesYet: tChat('noMessagesYet'),
      voiceMessage: tChat('voiceMessage'),
      photo: tChat('photo'),
      video: tChat('video'),
      attachment: tChat('attachment'),
      systemMessage: tChat('systemMessage'),
      message: tChat('message'),
    }),
    [tChat],
  );

  // Fetch teacher's groups and students
  const { data: groups = [], isLoading: isLoadingGroups } = useTeacherGroups(
    activeTab === 'groups' ? searchQuery : undefined
  );
  const { data: customGroupChats = [], isLoading: isLoadingCustomGroups } = useCustomGroupChats(
    activeTab === 'groups'
  );
  const { data: allChats = [] } = useChats();
  const { data: students = [], isLoading: isLoadingStudents } = useTeacherStudents(
    activeTab === 'students' ? searchQuery : undefined
  );
  const { data: admin, isLoading: isLoadingAdmin } = useTeacherAdmin();

  // Get unread counts for tabs
  const { counts: unreadCounts } = useTeacherUnreadCounts();

  // Create direct chat mutation
  const createDirectChat = useCreateDirectChat();

  // Socket for online status
  const { isUserOnline } = useSocket();

  const formatTime = (dateStr?: string) =>
    formatChatListTime(dateStr, locale, tChat('yesterday'));

  const getChatSortMeta = (chatId: string | null | undefined): ChatListSortable => {
    if (!chatId) {
      return { unreadCount: 0 };
    }
    const chat = allChats.find((item) => item.id === chatId);
    if (!chat) {
      return { unreadCount: 0 };
    }
    return {
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      updatedAt: chat.updatedAt,
      unreadCount: chat.unreadCount,
    };
  };

  const sortedGroupItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    type GroupItem =
      | { kind: 'custom'; chat: (typeof customGroupChats)[number] }
      | { kind: 'class'; group: (typeof groups)[number] };

    const items: Array<{ entry: GroupItem; sort: ChatListSortable }> = [];

    for (const chat of customGroupChats) {
      if (query && !(chat.name || '').toLowerCase().includes(query)) continue;
      const chatMeta = getChatSortMeta(chat.id);
      items.push({
        entry: { kind: 'custom', chat },
        sort: {
          ...chatMeta,
          lastMessage: chatMeta.lastMessage ?? chat.lastMessage ?? null,
          updatedAt: chat.updatedAt,
        },
      });
    }

    for (const group of groups) {
      if (
        query &&
        !group.name.toLowerCase().includes(query) &&
        !group.level?.toLowerCase().includes(query)
      ) {
        continue;
      }
      const chatMeta = group.chatId ? getChatSortMeta(group.chatId) : { unreadCount: 0 };
      items.push({
        entry: { kind: 'class', group },
        sort: {
          lastMessage: chatMeta.lastMessage ?? group.lastMessage ?? null,
          lastMessageAt: chatMeta.lastMessageAt,
          updatedAt: chatMeta.updatedAt ?? group.updatedAt,
          unreadCount: chatMeta.unreadCount ?? group.unreadCount ?? 0,
        },
      });
    }

    return sortChatListItems(items, (item) => item.sort).map((item) => item.entry);
  }, [customGroupChats, groups, searchQuery, allChats]);

  const sortedStudents = useMemo(
    () =>
      sortChatListItems(students, (student) => {
        const chatMeta = student.chatId
          ? getChatSortMeta(student.chatId)
          : { unreadCount: 0 };
        return {
          lastMessage: chatMeta.lastMessage ?? student.lastMessage ?? null,
          lastMessageAt: chatMeta.lastMessageAt,
          updatedAt: chatMeta.updatedAt ?? student.updatedAt,
          unreadCount: chatMeta.unreadCount ?? student.unreadCount ?? 0,
        };
      }),
    [students, allChats],
  );

  // Handle group click - fetch group chat
  const handleGroupClick = async (groupId: string, chatId: string | null) => {
    try {
      if (chatId) {
        // Chat exists, fetch it
        const chat = await fetchGroupChat(groupId);
        onSelectChat(chat);
      } else {
        // Chat doesn't exist yet; only Admin can create it - Teacher will get 403
        const chat = await fetchGroupChat(groupId);
        onSelectChat(chat);
      }
    } catch (error: unknown) {
      console.error('Failed to open group chat:', error);
      const is403 = error instanceof ApiError && error.statusCode === 403;
      if (is403) {
        alert(tChat('adminOnlyCreateGroupChat'));
      } else {
        alert(tChat('failedOpenGroupChat'));
      }
    }
  };

  // Handle student click - create or open DM
  const handleStudentClick = async (studentUserId: string, chatId: string | null) => {
    try {
      if (chatId) {
        // Chat exists, fetch it
        const { fetchChat } = await import('../api/chat.api');
        const chat = await fetchChat(chatId);
        onSelectChat(chat);
      } else {
        // Create new direct chat
        const newChat = await createDirectChat.mutateAsync(studentUserId);
        onSelectChat(newChat);
      }
    } catch (error) {
      console.error('Failed to open student chat:', error);
    }
  };

  // Handle admin click - create or open DM
  const handleAdminClick = async (adminUserId: string, chatId: string | null) => {
    try {
      if (chatId) {
        // Chat exists, fetch it
        const { fetchChat } = await import('../api/chat.api');
        const chat = await fetchChat(chatId);
        onSelectChat(chat);
      } else {
        // Create new direct chat
        const newChat = await createDirectChat.mutateAsync(adminUserId);
        onSelectChat(newChat);
      }
    } catch (error) {
      console.error('Failed to open admin chat:', error);
    }
  };

  const hasAdmin = admin !== null && admin !== undefined;
  const isLoading = activeTab === 'admin' ? isLoadingAdmin :
                    activeTab === 'groups' ? (isLoadingGroups || isLoadingCustomGroups) : isLoadingStudents;
  const hasData = activeTab === 'admin' ? hasAdmin :
                  activeTab === 'groups' ? (groups.length > 0 || customGroupChats.length > 0) : students.length > 0;

  const tabButtonClass = (tab: 'admin' | 'groups' | 'students') =>
    cn(
      'flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium transition-colors',
      'sm:relative sm:gap-0 sm:px-1.5 sm:py-2.5 sm:text-center sm:text-xs lg:text-sm',
      activeTab === tab
        ? 'bg-[#e8eaf6] text-[#1010a3]'
        : 'bg-[#f6f6f7] text-[#8b8b90] hover:bg-[#ececec]',
    );

  const tabUnreadBadgeClass =
    'flex h-4 min-w-[18px] shrink-0 items-center justify-center px-1 text-xs sm:absolute sm:-right-0.5 sm:-top-0.5 sm:min-w-[16px] sm:px-0.5 sm:text-[10px] sm:leading-none';

  const renderTabBar = () => (
    <div className="mx-auto grid w-full max-w-full grid-cols-3 gap-2 sm:gap-1.5">
      <button
        type="button"
        onClick={() => {
          setActiveTab('groups');
          setSearchQuery('');
        }}
        className={tabButtonClass('groups')}
      >
        <span className="sm:px-0.5">{tChat('groups')}</span>
        {unreadCounts.groups > 0 && (
          <Badge variant="error" className={tabUnreadBadgeClass}>
            {unreadCounts.groups}
          </Badge>
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          setActiveTab('students');
          setSearchQuery('');
        }}
        className={tabButtonClass('students')}
      >
        <span className="sm:px-0.5">{tChat('students')}</span>
        {unreadCounts.students > 0 && (
          <Badge variant="error" className={tabUnreadBadgeClass}>
            {unreadCounts.students}
          </Badge>
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          setActiveTab('admin');
          setSearchQuery('');
        }}
        className={tabButtonClass('admin')}
      >
        <span className="sm:px-0.5">{tChat('admin')}</span>
        {unreadCounts.admin > 0 && (
          <Badge variant="error" className={tabUnreadBadgeClass}>
            {unreadCounts.admin}
          </Badge>
        )}
      </button>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
        <div className="sticky top-0 z-20 bg-white">
          <div className="overflow-x-hidden border-b border-[rgba(14,14,16,0.07)] px-3 py-3">
            {renderTabBar()}
          </div>
          <div className="border-b border-[rgba(14,14,16,0.07)] px-3 pb-3 pt-2">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b90]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                placeholder={
                  activeTab === 'admin'
                    ? tChat('searchAdmin')
                    : activeTab === 'groups'
                      ? tChat('searchGroups')
                      : tChat('searchStudents')
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] bg-white py-2 pl-9 pr-4 text-[16px] text-[#3b3b40] placeholder:text-[#8b8b90] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15 lg:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasData ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {activeTab === 'groups' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                )}
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              {searchQuery
                ? activeTab === 'admin'
                  ? tChat('noAdminFound')
                  : activeTab === 'groups'
                    ? tChat('noGroupsFound')
                    : tChat('noStudentsFound')
                : activeTab === 'admin'
                  ? tChat('noAdminAvailable')
                  : activeTab === 'groups'
                    ? tChat('noAssignedGroups')
                    : tChat('noAssignedStudents')}
            </p>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? tChat('tryDifferentSearch')
                : activeTab === 'admin'
                  ? tChat('adminContactAppearHere')
                  : activeTab === 'groups'
                    ? tChat('assignedGroupsAppearHere')
                    : tChat('assignedStudentsAppearHere')}
            </p>
          </div>
        ) : activeTab === 'admin' ? (
          // Admin section
          hasAdmin && admin ? (
            <div className="border-b border-slate-200">
              <button
                onClick={() => handleAdminClick(admin.id, admin.chatId || null)}
                disabled={createDirectChat.isPending}
                className={cn(
                  'w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left',
                  activeChat?.id === admin.chatId && 'bg-primary/10 hover:bg-primary/10',
                  createDirectChat.isPending && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  {admin.avatarUrl ? (
                    <Image
                      src={admin.avatarUrl}
                      alt={admin.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br from-purple-500 to-purple-600">
                      {admin.firstName?.[0]}{admin.lastName?.[0]}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={cn(
                        'font-medium truncate',
                        (admin.unreadCount || 0) > 0 ? 'text-slate-900' : 'text-slate-700'
                      )}
                    >
                      {admin.name}
                    </h3>
                    {admin.chatId && admin.updatedAt && (
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatTime(admin.lastMessage?.createdAt || admin.updatedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {admin.chatId ? (
                      <>
                        <p
                          className={cn(
                            'text-sm truncate',
                            (admin.unreadCount || 0) > 0 ? 'text-slate-700 font-medium' : 'text-slate-500'
                          )}
                        >
                          {formatMessagePreview(admin.lastMessage, messagePreviewLabels)}
                        </p>
                        {(admin.unreadCount || 0) > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full flex-shrink-0">
                            {admin.unreadCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        {tChat('clickToStartConversation')}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </div>
          ) : null
        ) : activeTab === 'groups' ? (
          sortedGroupItems.map((item) => {
            if (item.kind === 'custom') {
              const chat = item.chat;
              const fullChat = allChats.find((c) => c.id === chat.id);
              const unread = fullChat?.unreadCount ?? 0;
              const lastMsg = fullChat?.lastMessage ?? chat.lastMessage;
              const isActive =
                activeChat?.type === 'GROUP' &&
                !activeChat?.groupId &&
                activeChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(fullChat || chat)}
                  className={cn(
                    'w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left',
                    isActive && 'bg-primary/10 hover:bg-primary/10',
                  )}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br from-purple-500 to-purple-600">
                      {(chat.name || 'Group')[0]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={cn(
                          'font-medium truncate',
                          unread > 0 ? 'text-slate-900' : 'text-slate-700',
                        )}
                      >
                        {chat.name || tChat('groupChatLabel')}
                      </h3>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatTime(lastMsg?.createdAt || chat.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          'text-sm truncate',
                          unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-500',
                        )}
                      >
                        {formatMessagePreview(lastMsg, messagePreviewLabels)}
                      </p>
                      {unread > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full flex-shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{tChat('groupChatLabel')}</p>
                  </div>
                </button>
              );
            }

            const group = item.group;
            const isActive = activeChat?.groupId === group.id;
            const unread = Math.max(0, Number(group.unreadCount) || 0);
            const total = Math.max(0, Number(group.messageCount) || 0);
            const hasUnread = unread > 0;
            const showBadge = hasUnread;
            const count = hasUnread ? unread : total;
            const GroupListIcon = getGroupIconComponent(group.iconKey);

            return (
              <button
                key={group.id}
                onClick={() => handleGroupClick(group.id, group.chatId)}
                className={cn(
                  'w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left',
                  isActive && 'bg-primary/10 hover:bg-primary/10',
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br from-purple-500 to-purple-600">
                    {GroupListIcon ? (
                      <GroupListIcon
                        className="text-white"
                        size={24}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    ) : (
                      group.name[0]
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3
                      className={cn(
                        'font-medium truncate flex-1 min-w-0',
                        hasUnread ? 'text-slate-900' : 'text-slate-700',
                      )}
                      title={group.name}
                    >
                      {group.name}
                    </h3>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {formatTime(group.lastMessage?.createdAt || group.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <p
                      className={cn(
                        'text-sm truncate flex-1 min-w-0',
                        hasUnread ? 'text-slate-700 font-medium' : 'text-slate-500',
                      )}
                    >
                      {formatMessagePreview(group.lastMessage, messagePreviewLabels)}
                    </p>
                    {showBadge && (
                      <span
                        className="ml-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full flex-shrink-0 min-w-[1.25rem] text-center"
                        aria-label={tChat('unreadCount', { count })}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {group.level
                      ? tChat('classGroupWithLevel', { level: group.level })
                      : tChat('classGroup')}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          // Students list
          sortedStudents.map((student) => {
            const isActive = activeChat?.id === student.chatId;
            const hasUnread = (student.unreadCount || 0) > 0;
            const isOnline = student.chatId
              ? isUserOnline(student.chatId, student.id)
              : false;
            const studentName = formatDisplayName(student.firstName, student.lastName);
            const initials = getInitialsFromParts(student.firstName, student.lastName);

            return (
              <button
                key={student.id}
                onClick={() => handleStudentClick(student.id, student.chatId)}
                disabled={createDirectChat.isPending}
                className={cn(
                  'w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left',
                  isActive && 'bg-primary/10 hover:bg-primary/10',
                  createDirectChat.isPending && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  {student.avatarUrl ? (
                    <Image
                      src={student.avatarUrl}
                      alt={studentName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-primary">
                      {initials}
                    </div>
                  )}
                  <OnlineStatusDot isOnline={isOnline} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={cn(
                        'font-medium truncate',
                        hasUnread ? 'text-slate-900' : 'text-slate-700'
                      )}
                    >
                      {studentName}
                    </h3>
                    {student.chatId && (
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatTime(student.lastMessage?.createdAt || student.updatedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {student.chatId ? (
                      <>
                        <p
                          className={cn(
                            'text-sm truncate',
                            hasUnread ? 'text-slate-700 font-medium' : 'text-slate-500'
                          )}
                        >
                          {formatMessagePreview(student.lastMessage, messagePreviewLabels)}
                        </p>
                        {hasUnread && (
                          <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full flex-shrink-0">
                            {student.unreadCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        {tChat('clickToStartConversation')}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
}

