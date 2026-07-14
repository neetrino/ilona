'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  useAdminStudents,
  useAdminTeachers,
  useAdminGroups,
  useAdminUnreadCounts,
  useChats,
  useCustomGroupChats,
  useSocket,
} from '../../hooks';
import { fetchGroupChat, createDirectChat } from '../../api/chat.api';
import { useChatStore } from '../../store/chat.store';
import { sortChatListItems, type ChatListSortable } from '../../utils/chat-utils';
import type {
  AdminChatListProps,
  AdminChatListViewModel,
  AdminChatTab,
  AdminGroupListItem,
} from './admin-chat-list.types';

export function useAdminChatList({
  activeTab,
  onTabChange,
  onSelectChat,
}: AdminChatListProps): AdminChatListViewModel {
  const tChat = useTranslations('chat');
  const { activeChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const { counts: unreadCounts } = useAdminUnreadCounts();
  const { data: chats = [] } = useChats();
  useSocket();
  const presenceByUserId = useChatStore((state) => state.presenceByUserId);

  const tabLabels: Record<AdminChatTab, string> = useMemo(
    () => ({
      groups: tChat('groups'),
      teachers: tChat('teachersTab'),
      students: tChat('students'),
    }),
    [tChat],
  );

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  const { data: students = [], isLoading: isLoadingStudents } = useAdminStudents(
    activeTab === 'students' ? searchQuery : undefined,
  );
  const { data: teachers = [], isLoading: isLoadingTeachers } = useAdminTeachers(
    activeTab === 'teachers' ? searchQuery : undefined,
  );
  const { data: groups = [], isLoading: isLoadingGroups } = useAdminGroups(
    activeTab === 'groups' ? searchQuery : undefined,
  );
  const { data: customGroupChats = [], isLoading: isLoadingCustomGroups } = useCustomGroupChats(
    activeTab === 'groups',
  );

  const isLoading =
    activeTab === 'students'
      ? isLoadingStudents
      : activeTab === 'teachers'
        ? isLoadingTeachers
        : activeTab === 'groups'
          ? isLoadingGroups || isLoadingCustomGroups
          : false;

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

  const getUserUnreadCount = useCallback(
    (userId: string): number => {
      const chat = chats.find((c) => {
        if (c.type !== 'DIRECT') return false;
        return c.participants.some((p) => p.userId === userId);
      });
      return chat?.unreadCount || 0;
    },
    [chats],
  );

  const getDirectChatSortMeta = useCallback(
    (userId: string): ChatListSortable => {
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
    },
    [chats],
  );

  const sortedStudents = useMemo(
    () => sortChatListItems(students, (student) => getDirectChatSortMeta(student.id)),
    [students, getDirectChatSortMeta],
  );

  const sortedTeachers = useMemo(
    () => sortChatListItems(teachers, (teacher) => getDirectChatSortMeta(teacher.id)),
    [teachers, getDirectChatSortMeta],
  );

  const sortedGroupItems = useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase();
    const items: Array<{ entry: AdminGroupListItem; sort: ChatListSortable }> = [];

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

  const getUserOnlineStatus = useCallback(
    (userId: string): boolean => Boolean(presenceByUserId[userId]?.isOnline),
    [presenceByUserId],
  );

  const handleSelectUser = useCallback(
    async (userId: string) => {
      try {
        const chat = await createDirectChat(userId);
        onSelectChat(chat);
      } catch (error) {
        console.error('Failed to create/open chat:', error);
      }
    },
    [onSelectChat],
  );

  const handleSelectGroup = useCallback(
    async (groupId: string) => {
      try {
        const chat = await fetchGroupChat(groupId);
        onSelectChat(chat);
      } catch (error) {
        console.error('Failed to fetch group chat:', error);
      }
    },
    [onSelectChat],
  );

  const hasData =
    activeTab === 'students'
      ? students.length > 0
      : activeTab === 'teachers'
        ? teachers.length > 0
        : activeTab === 'groups'
          ? sortedGroupItems.length > 0
          : false;

  return {
    activeTab,
    onTabChange,
    searchQuery,
    setSearchQuery,
    tabLabels,
    unreadCounts,
    isLoading,
    hasData,
    sortedStudents,
    sortedTeachers,
    sortedGroupItems,
    groupUnreadMap,
    activeChat,
    getUserUnreadCount,
    getUserOnlineStatus,
    handleSelectUser,
    handleSelectGroup,
    onSelectChat,
  };
}
