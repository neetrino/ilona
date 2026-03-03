'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChats, useSocket, useCreateDirectChat } from '../hooks';
import { useChatStore } from '../store/chat.store';
import { useMyTeachers } from '@/features/students/hooks/useStudents';
import type { Chat } from '../types';
import type { AssignedTeacher } from '@/features/students/api/students.api';
import { cn } from '@/shared/lib/utils';
import { formatMessagePreview } from '../utils';
import Image from 'next/image';

function getAvatarFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.charAt(0).toUpperCase() || '?';
}

type ListItem =
  | { type: 'chat'; chat: Chat }
  | { type: 'teacher_placeholder'; teacher: AssignedTeacher };

interface StudentChatListProps {
  onSelectChat: (chat: Chat) => void;
}

export function StudentChatList({ onSelectChat }: StudentChatListProps) {
  const { user } = useAuthStore();
  const { activeChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch chats from API (all chats - 1:1 and group, including with admin)
  const { data: chats = [], isLoading: isLoadingChats } = useChats();
  // Assigned teacher(s) so they always appear in the list (with or without existing chat)
  const { data: teachers = [], isLoading: isLoadingTeachers } = useMyTeachers(true);
  const createDirectChat = useCreateDirectChat();

  // Socket for online status
  const { isConnected, isUserOnline } = useSocket();

  // Chats filtered and sorted by recency
  const filteredChats = useMemo(() => {
    let list = chats.filter((chat) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      if (chat.name?.toLowerCase().includes(query)) return true;
      if (chat.group?.name?.toLowerCase().includes(query)) return true;
      return chat.participants.some((p) => {
        const fullName = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
        return fullName.includes(query);
      });
    });
    list = [...list].sort((a, b) => {
      const aTime = new Date(a.lastMessage?.createdAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.lastMessage?.createdAt || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });
    return list;
  }, [chats, searchQuery]);

  // Unified list: assigned teachers (show as chat or placeholder) + all other chats
  const listItems = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    const teacherIdsWithChat = new Set<string>();
    const q = searchQuery?.toLowerCase() ?? '';

    for (const chat of filteredChats) {
      if (chat.type === 'DIRECT') {
        const other = chat.participants.find((p) => p.userId !== user?.id);
        if (other?.userId) teacherIdsWithChat.add(other.userId);
      }
    }

    // Add teacher placeholders for assigned teachers who don't have a chat in the list yet
    for (const teacher of teachers) {
      if (teacherIdsWithChat.has(teacher.userId)) continue;
      if (q && !teacher.name.toLowerCase().includes(q)) continue;
      items.push({ type: 'teacher_placeholder', teacher });
    }

    // Add all chats (group + direct, including with teacher)
    for (const chat of filteredChats) {
      items.push({ type: 'chat', chat });
    }

    return items;
  }, [filteredChats, teachers, user?.id, searchQuery]);

  // Get chat display info
  const getChatInfo = (chat: Chat) => {
    if (chat.type === 'GROUP') {
      return {
        name: chat.name || chat.group?.name || 'Group Chat',
        avatar: chat.name?.[0] || chat.group?.name?.[0] || 'G',
        avatarUrl: null,
        isGroup: true,
      };
    }

    // Direct chat - show other participant
    const otherParticipant = chat.participants.find((p) => p.userId !== user?.id);
    const name = otherParticipant
      ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`
      : 'Unknown';

    return {
      name,
      avatar: otherParticipant
        ? `${otherParticipant.user.firstName[0]}${otherParticipant.user.lastName[0]}`
        : '?',
      avatarUrl: otherParticipant?.user.avatarUrl || null,
      isGroup: false,
      otherUserId: otherParticipant?.userId,
    };
  };

  // Format last message time
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Today
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getDate() === yesterday.getDate()) {
      return 'Yesterday';
    }

    // This week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    // Older
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Messages</h2>
          {/* Connection status */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
              isConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            )}
            title={isConnected ? 'Connected' : 'Disconnected'}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            {isConnected ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Unified chat list: teachers (or placeholder) + all chats */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingChats || isLoadingTeachers ? (
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
          ) : listItems.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </p>
              <p className="text-xs text-slate-500">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Your conversations will appear here'}
              </p>
            </div>
          ) : (
            listItems.map((item) => {
              if (item.type === 'teacher_placeholder') {
                const { teacher } = item;
                const isCreating = createDirectChat.isPending;
                return (
                  <button
                    key={`teacher-${teacher.userId}`}
                    onClick={() => {
                      createDirectChat.mutate(teacher.userId, {
                        onSuccess: (newChat) => onSelectChat(newChat),
                      });
                    }}
                    disabled={isCreating}
                    className={cn(
                      'w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left',
                      isCreating && 'opacity-60 cursor-wait'
                    )}
                  >
                    <div className="relative">
                      {teacher.avatarUrl ? (
                        <Image
                          src={teacher.avatarUrl}
                          alt={teacher.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-primary">
                          {getAvatarFromName(teacher.name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium truncate text-slate-700">{teacher.name}</h3>
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {isCreating ? 'Opening chat...' : 'My Teacher — tap to message'}
                      </p>
                    </div>
                  </button>
                );
              }

              const chat = item.chat;
              const info = getChatInfo(chat);
              const isActive = activeChat?.id === chat.id;
              const hasUnread = (chat.unreadCount || 0) > 0;
              const isOnline = info.otherUserId
                ? isUserOnline(chat.id, info.otherUserId)
                : false;

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={cn(
                    'w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left',
                    isActive && 'bg-primary/10 hover:bg-primary/10'
                  )}
                >
                  <div className="relative">
                    {info.avatarUrl ? (
                      <Image
                        src={info.avatarUrl}
                        alt={info.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold',
                          info.isGroup
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                            : 'bg-primary'
                        )}
                      >
                        {info.avatar}
                      </div>
                    )}
                    {!info.isGroup && isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={cn(
                          'font-medium truncate',
                          hasUnread ? 'text-slate-900' : 'text-slate-700'
                        )}
                      >
                        {info.name}
                      </h3>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          'text-sm truncate',
                          hasUnread ? 'text-slate-700 font-medium' : 'text-slate-500'
                        )}
                      >
                        {formatMessagePreview(chat.lastMessage)}
                      </p>
                      {hasUnread && (
                        <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full flex-shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
      </div>
    </div>
  );
}



