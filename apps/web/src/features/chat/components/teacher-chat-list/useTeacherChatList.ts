'use client';

import { useState, useMemo, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  useTeacherGroups,
  useTeacherStudents,
  useTeacherAdmin,
  useSocket,
  useCreateDirectChat,
  useTeacherUnreadCounts,
  useCustomGroupChats,
  useChats,
} from '../../hooks';
import { fetchGroupChat } from '../../api/chat.api';
import { useChatStore } from '../../store/chat.store';
import { ApiError } from '@/shared/lib/api';
import { formatChatListTime, sortChatListItems, type ChatListSortable } from '../../utils/chat-utils';
import type {
  TeacherChatListProps,
  TeacherChatTab,
  TeacherGroupListItem,
  TeacherChatListViewModel,
} from './teacher-chat-list.types';

export function useTeacherChatList({ onSelectChat }: TeacherChatListProps): TeacherChatListViewModel {
  const tChat = useTranslations('chat');
  const locale = useLocale();
  const { user: _user } = useAuthStore();
  const { activeChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTabState] = useState<TeacherChatTab>('groups');

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

  const { data: groups = [], isLoading: isLoadingGroups } = useTeacherGroups(
    activeTab === 'groups' ? searchQuery : undefined,
  );
  const { data: customGroupChats = [], isLoading: isLoadingCustomGroups } = useCustomGroupChats(
    activeTab === 'groups',
  );
  const { data: allChats = [] } = useChats();
  const { data: students = [], isLoading: isLoadingStudents } = useTeacherStudents(
    activeTab === 'students' ? searchQuery : undefined,
  );
  const { data: admin, isLoading: isLoadingAdmin } = useTeacherAdmin();
  const { counts: unreadCounts } = useTeacherUnreadCounts();
  const createDirectChat = useCreateDirectChat();
  const { isUserOnline } = useSocket();

  const formatTime = useCallback(
    (dateStr?: string) => formatChatListTime(dateStr, locale, tChat('yesterday')),
    [locale, tChat],
  );

  const getChatSortMeta = useCallback(
    (chatId: string | null | undefined): ChatListSortable => {
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
    },
    [allChats],
  );

  const sortedGroupItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const items: Array<{ entry: TeacherGroupListItem; sort: ChatListSortable }> = [];

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
  }, [customGroupChats, groups, searchQuery, getChatSortMeta]);

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
    [students, getChatSortMeta],
  );

  const handleGroupClick = useCallback(
    async (groupId: string, _chatId: string | null) => {
      try {
        const chat = await fetchGroupChat(groupId);
        onSelectChat(chat);
      } catch (error: unknown) {
        console.error('Failed to open group chat:', error);
        const is403 = error instanceof ApiError && error.statusCode === 403;
        if (is403) {
          alert(tChat('adminOnlyCreateGroupChat'));
        } else {
          alert(tChat('failedOpenGroupChat'));
        }
      }
    },
    [onSelectChat, tChat],
  );

  const handleStudentClick = useCallback(
    async (studentUserId: string, chatId: string | null) => {
      try {
        if (chatId) {
          const { fetchChat } = await import('../../api/chat.api');
          const chat = await fetchChat(chatId);
          onSelectChat(chat);
        } else {
          const newChat = await createDirectChat.mutateAsync(studentUserId);
          onSelectChat(newChat);
        }
      } catch (error) {
        console.error('Failed to open student chat:', error);
      }
    },
    [createDirectChat, onSelectChat],
  );

  const handleAdminClick = useCallback(
    async (adminUserId: string, chatId: string | null) => {
      try {
        if (chatId) {
          const { fetchChat } = await import('../../api/chat.api');
          const chat = await fetchChat(chatId);
          onSelectChat(chat);
        } else {
          const newChat = await createDirectChat.mutateAsync(adminUserId);
          onSelectChat(newChat);
        }
      } catch (error) {
        console.error('Failed to open admin chat:', error);
      }
    },
    [createDirectChat, onSelectChat],
  );

  const setActiveTab = useCallback((tab: TeacherChatTab) => {
    setActiveTabState(tab);
    setSearchQuery('');
  }, []);

  const hasAdmin = admin !== null && admin !== undefined;
  const isLoading =
    activeTab === 'admin'
      ? isLoadingAdmin
      : activeTab === 'groups'
        ? isLoadingGroups || isLoadingCustomGroups
        : isLoadingStudents;
  const hasData =
    activeTab === 'admin'
      ? hasAdmin
      : activeTab === 'groups'
        ? groups.length > 0 || customGroupChats.length > 0
        : students.length > 0;

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    unreadCounts,
    isLoading,
    hasData,
    admin,
    sortedGroupItems,
    sortedStudents,
    allChats,
    activeChat,
    createDirectChatPending: createDirectChat.isPending,
    messagePreviewLabels,
    formatTime,
    isUserOnline,
    handleGroupClick,
    handleStudentClick,
    handleAdminClick,
    onSelectChat,
  };
}
