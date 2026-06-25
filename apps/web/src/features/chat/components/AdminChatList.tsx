'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useAdminStudents, useAdminTeachers, useAdminGroups, useAdminUnreadCounts, useChats, useCustomGroupChats } from '../hooks';
import { useChatStore } from '../store/chat.store';
import { fetchGroupChat, createDirectChat } from '../api/chat.api';
import type { Chat } from '../types';
import { cn, formatPhoneForDisplay } from '@/shared/lib/utils';
import { Badge } from '@/shared/components/ui/badge';
import { getInitials } from '@/shared/components/ui/avatar';
import Image from 'next/image';
import { getGroupIconComponent } from '@/features/groups';
import { ChatEmptyState } from './ChatEmptyState';
import { OnlineStatusDot } from './OnlineStatusDot';
import { useSocket } from '../hooks/useSocket';
import { sortChatListItems, type ChatListSortable } from '../utils/chat-utils';

type AdminChatTab = 'students' | 'teachers' | 'groups';

interface AdminChatListProps {
  activeTab: AdminChatTab | null;
  onTabChange: (tab: AdminChatTab) => void;
  onSelectChat: (chat: Chat) => void;
}

export function AdminChatList({ activeTab, onTabChange, onSelectChat }: AdminChatListProps) {
  const tChat = useTranslations('chat');
  const { user: _user } = useAuthStore();
  const { activeChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const { counts: unreadCounts } = useAdminUnreadCounts();
  const { data: chats = [] } = useChats();
  const { isUserOnline } = useSocket();

  const tabLabels: Record<AdminChatTab, string> = {
    groups: tChat('groups'),
    teachers: tChat('teachersTab'),
    students: tChat('students'),
  };

  // Reset search query when tab changes
  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  // Fetch data based on active tab
  const { data: students = [], isLoading: isLoadingStudents } = useAdminStudents(
    activeTab === 'students' ? searchQuery : undefined
  );
  const { data: teachers = [], isLoading: isLoadingTeachers } = useAdminTeachers(
    activeTab === 'teachers' ? searchQuery : undefined
  );
  const { data: groups = [], isLoading: isLoadingGroups } = useAdminGroups(
    activeTab === 'groups' ? searchQuery : undefined
  );
  const { data: customGroupChats = [], isLoading: isLoadingCustomGroups } = useCustomGroupChats(
    activeTab === 'groups'
  );

  const isLoading = activeTab === 'students' ? isLoadingStudents : 
                    activeTab === 'teachers' ? isLoadingTeachers : 
                    activeTab === 'groups' ? (isLoadingGroups || isLoadingCustomGroups) :
                    false;

  // Unread: class groups by groupId, custom group chats by chat id
  const groupUnreadMap = useMemo(() => {
    const map = new Map<string, number>();
    chats.forEach((chat) => {
      if (chat.type === 'GROUP' && (chat.unreadCount || 0) > 0) {
        if (chat.groupId) {
          map.set(chat.groupId, chat.unreadCount || 0);
        } else {
          map.set(chat.id, chat.unreadCount || 0);
        }
      }
    });
    return map;
  }, [chats]);

  // Get unread count for a specific user ID
  const getUserUnreadCount = (userId: string): number => {
    const chat = chats.find((c) => {
      if (c.type !== 'DIRECT') return false;
      return c.participants.some((p) => p.userId === userId);
    });
    return chat?.unreadCount || 0;
  };

  const getDirectChatSortMeta = (userId: string): ChatListSortable => {
    const chat = chats.find(
      (c) => c.type === 'DIRECT' && c.participants.some((p) => p.userId === userId),
    );
    if (!chat) return { unreadCount: 0 };
    return {
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      updatedAt: chat.updatedAt,
      unreadCount: chat.unreadCount,
    };
  };

  const sortedStudents = useMemo(
    () => sortChatListItems(students, (student) => getDirectChatSortMeta(student.id)),
    [students, chats],
  );

  const sortedTeachers = useMemo(
    () => sortChatListItems(teachers, (teacher) => getDirectChatSortMeta(teacher.id)),
    [teachers, chats],
  );

  const sortedGroupItems = useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase();
    type GroupItem =
      | { kind: 'custom'; chat: (typeof customGroupChats)[number] }
      | { kind: 'class'; group: (typeof groups)[number] };

    const items: Array<{ entry: GroupItem; sort: ChatListSortable }> = [];

    for (const chat of customGroupChats) {
      if (searchLower && !(chat.name || '').toLowerCase().includes(searchLower)) continue;
      const fullChat = chats.find((item) => item.id === chat.id);
      items.push({
        entry: { kind: 'custom', chat },
        sort: {
          lastMessage: fullChat?.lastMessage ?? null,
          lastMessageAt: fullChat?.lastMessageAt,
          updatedAt: fullChat?.updatedAt ?? chat.updatedAt,
          unreadCount: fullChat?.unreadCount ?? groupUnreadMap.get(chat.id) ?? 0,
        },
      });
    }

    for (const group of groups) {
      if (
        searchLower &&
        !group.name.toLowerCase().includes(searchLower) &&
        !group.center?.name?.toLowerCase().includes(searchLower)
      ) {
        continue;
      }
      const fullChat = chats.find((item) => item.groupId === group.id);
      items.push({
        entry: { kind: 'class', group },
        sort: {
          lastMessage: fullChat?.lastMessage ?? null,
          lastMessageAt: fullChat?.lastMessageAt,
          updatedAt: fullChat?.updatedAt,
          unreadCount: fullChat?.unreadCount ?? groupUnreadMap.get(group.id) ?? 0,
        },
      });
    }

    return sortChatListItems(items, (item) => item.sort).map((item) => item.entry);
  }, [customGroupChats, groups, searchQuery, chats, groupUnreadMap]);

  const getUserOnlineStatus = (userId: string): boolean => {
    const chat = chats.find(
      (c) => c.type === 'DIRECT' && c.participants.some((p) => p.userId === userId),
    );
    if (!chat) return false;
    return isUserOnline(chat.id, userId);
  };

  // Handle selecting a student/teacher (create or open DM)
  const handleSelectUser = async (userId: string) => {
    try {
      // Try to create or get existing direct chat
      const chat = await createDirectChat(userId);
      onSelectChat(chat);
    } catch (error) {
      console.error('Failed to create/open chat:', error);
    }
  };

  // Handle selecting a group (open group chat)
  const handleSelectGroup = async (groupId: string) => {
    try {
      const chat = await fetchGroupChat(groupId);
      onSelectChat(chat);
    } catch (error) {
      console.error('Failed to fetch group chat:', error);
    }
  };

  // Render list items
  const renderStudents = () => {
    if (isLoading) {
      return (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 bg-slate-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (students.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">
            {searchQuery ? tChat('noStudentsFound') : tChat('noStudentsAvailable')}
          </p>
          <p className="text-xs text-slate-500">
            {searchQuery ? tChat('tryDifferentSearch') : tChat('studentsAppearHere')}
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-slate-100">
        {sortedStudents.map((student) => (
          <button
            key={student.id}
            onClick={() => handleSelectUser(student.id)}
            className={cn(
              'w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left',
              activeChat?.type === 'DIRECT' && activeChat?.participants.some(p => p.userId === student.id) && 'bg-primary/10 hover:bg-primary/10'
            )}
          >
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                {student.avatarUrl ? (
                  <Image src={student.avatarUrl} alt={student.name} width={48} height={48} className="w-full h-full rounded-full object-cover" unoptimized />
                ) : (
                  getInitials(student.name)
                )}
              </div>
              <OnlineStatusDot isOnline={getUserOnlineStatus(student.id)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-slate-900 truncate">{student.name}</h3>
                {getUserUnreadCount(student.id) > 0 && (
                  <Badge variant="error" className="flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {getUserUnreadCount(student.id)}
                  </Badge>
                )}
              </div>
              {student.phone && (
                <p className="text-sm text-slate-500 truncate">{formatPhoneForDisplay(student.phone)}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderTeachers = () => {
    if (isLoading) {
      return (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 bg-slate-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (teachers.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">
            {searchQuery ? tChat('noTeachersFound') : tChat('noTeachersAvailable')}
          </p>
          <p className="text-xs text-slate-500">
            {searchQuery ? tChat('tryDifferentSearch') : tChat('teachersAppearHere')}
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-slate-100">
        {sortedTeachers.map((teacher) => (
          <button
            key={teacher.id}
            onClick={() => handleSelectUser(teacher.id)}
            className={cn(
              'w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left',
              activeChat?.type === 'DIRECT' && activeChat?.participants.some(p => p.userId === teacher.id) && 'bg-primary/10 hover:bg-primary/10'
            )}
          >
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {teacher.avatarUrl ? (
                  <Image src={teacher.avatarUrl} alt={teacher.name} width={48} height={48} className="w-full h-full rounded-full object-cover" unoptimized />
                ) : (
                  getInitials(teacher.name)
                )}
              </div>
              <OnlineStatusDot isOnline={getUserOnlineStatus(teacher.id)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-slate-900 truncate">{teacher.name}</h3>
                {getUserUnreadCount(teacher.id) > 0 && (
                  <Badge variant="error" className="flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {getUserUnreadCount(teacher.id)}
                  </Badge>
                )}
              </div>
              {teacher.phone && (
                <p className="text-sm text-slate-500 truncate">{formatPhoneForDisplay(teacher.phone)}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderGroups = () => {
    if (isLoading) {
      return (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 bg-slate-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (sortedGroupItems.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 10a3 3 0 11-6 0 3 3 0 016 0zm5 2a3 3 0 11-6 0 3 3 0 016 0zM9 20h5v-2a3 3 0 00-5.196-2.121M9 20H4v-2a3 3 0 015.196-2.121M9 20v-2a3 3 0 015.196-2.121" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">
            {searchQuery ? tChat('noGroupsFound') : tChat('noGroupsAvailable')}
          </p>
          <p className="text-xs text-slate-500">
            {searchQuery ? tChat('tryDifferentSearch') : tChat('createGroupOrSelectClass')}
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-slate-100">
        {sortedGroupItems.map((item) => {
          if (item.kind === 'custom') {
            const chat = item.chat;
            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={cn(
                  'w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left',
                  activeChat?.type === 'GROUP' && !activeChat?.groupId && activeChat?.id === chat.id && 'bg-primary/10 hover:bg-primary/10',
                )}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {getInitials(chat.name || tChat('groupDefault'))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-slate-900 truncate">{chat.name || tChat('groupChatLabel')}</h3>
                    {(groupUnreadMap.get(chat.id) || 0) > 0 && (
                      <Badge variant="error" className="flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {groupUnreadMap.get(chat.id)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {tChat('groupChatParticipants', { count: chat.participants?.length ?? 0 })}
                  </p>
                </div>
              </button>
            );
          }

          const group = item.group;
          const GroupListIcon = getGroupIconComponent(group.iconKey);
          return (
            <button
              key={group.id}
              onClick={() => handleSelectGroup(group.id)}
              className={cn(
                'w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left',
                activeChat?.type === 'GROUP' && activeChat?.groupId === group.id && 'bg-primary/10 hover:bg-primary/10',
              )}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {GroupListIcon ? (
                  <GroupListIcon className="text-white" size={24} strokeWidth={1.75} aria-hidden />
                ) : (
                  getInitials(group.name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-slate-900 truncate">{group.name}</h3>
                  {(groupUnreadMap.get(group.id) || 0) > 0 && (
                    <Badge variant="error" className="flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {groupUnreadMap.get(group.id)}
                    </Badge>
                  )}
                </div>
                {group.center && (
                  <p className="text-sm text-slate-500 truncate">{group.center.name}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const tabButtonClass = (tab: AdminChatTab) =>
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
    <div className="mx-auto grid w-full max-w-full grid-cols-3 gap-2 sm:grid-cols-[0.82fr_1.09fr_1.09fr] sm:gap-1.5">
      <button type="button" onClick={() => onTabChange('groups')} className={tabButtonClass('groups')}>
        <span className="sm:px-0.5">{tChat('groups')}</span>
        {unreadCounts.groups > 0 && (
          <Badge variant="error" className={tabUnreadBadgeClass}>
            {unreadCounts.groups}
          </Badge>
        )}
      </button>
      <button type="button" onClick={() => onTabChange('teachers')} className={tabButtonClass('teachers')}>
        <span className="sm:px-0.5">{tChat('teachersTab')}</span>
        {unreadCounts.teachers > 0 && (
          <Badge variant="error" className={tabUnreadBadgeClass}>
            {unreadCounts.teachers}
          </Badge>
        )}
      </button>
      <button type="button" onClick={() => onTabChange('students')} className={tabButtonClass('students')}>
        <span className="sm:px-0.5">{tChat('students')}</span>
        {unreadCounts.students > 0 && (
          <Badge variant="error" className={tabUnreadBadgeClass}>
            {unreadCounts.students}
          </Badge>
        )}
      </button>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {!activeTab ? (
        <>
          <div className="shrink-0 overflow-x-hidden border-b border-[rgba(14,14,16,0.07)] bg-white px-3 py-3">
            {renderTabBar()}
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <ChatEmptyState
              title={tChat('selectCategory')}
              description={tChat('selectCategoryDescription')}
            />
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
          <div className="sticky top-0 z-20 bg-white">
            <div className="overflow-x-hidden border-b border-[rgba(14,14,16,0.07)] px-3 py-3 sm:px-3">
              {renderTabBar()}
            </div>
            <div className="border-b border-[rgba(14,14,16,0.07)] px-3 pb-3 pt-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  placeholder={tChat('searchTab', { tab: activeTab ? tabLabels[activeTab] : '' })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] bg-white py-2 pl-9 pr-4 text-sm text-[#3b3b40] placeholder:text-[#8b8b90] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15"
                />
              </div>
            </div>
          </div>
          {activeTab === 'students' && renderStudents()}
          {activeTab === 'teachers' && renderTeachers()}
          {activeTab === 'groups' && renderGroups()}
        </div>
      )}
    </div>
  );
}

