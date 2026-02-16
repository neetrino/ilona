'use client';

import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChats, useSocket } from '../hooks';
import { useChatStore } from '../store/chat.store';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';
import { formatMessagePreview } from '../utils';

interface ChatListProps {
  onSelectChat: (chat: Chat) => void;
}

export function ChatList({ onSelectChat }: ChatListProps) {
  const { user } = useAuthStore();
  const { activeChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch chats from API
  const { data: chats = [], isLoading } = useChats();

  // Socket for online status
  const { isConnected, isUserOnline } = useSocket();

  // Sort chats by lastMessageAt (newest first), then filter by search
  const sortedChats = [...chats].sort((a, b) => {
    // Use lastMessageAt if available, otherwise fall back to lastMessage.createdAt, then updatedAt
    const aTime = a.lastMessageAt 
      ? new Date(a.lastMessageAt).getTime()
      : (a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime());
    const bTime = b.lastMessageAt 
      ? new Date(b.lastMessageAt).getTime()
      : (b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime());
    return bTime - aTime; // DESC order (newest first)
  });

  // Filter chats by search
  const filteredChats = sortedChats.filter((chat) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    // Search in chat name
    if (chat.name?.toLowerCase().includes(query)) return true;

    // Search in group name
    if (chat.group?.name?.toLowerCase().includes(query)) return true;

    // Search in participant names
    return chat.participants.some((p) => {
      const fullName = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
      return fullName.includes(query);
    });
  });

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

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
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
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-slate-500">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Group chats will appear here when you join a group'}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
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
                {/* Avatar */}
                <div className="relative">
                  {info.avatarUrl ? (
                    <img
                      src={info.avatarUrl}
                      alt={info.name}
                      className="w-12 h-12 rounded-full object-cover"
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

                {/* Content */}
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
