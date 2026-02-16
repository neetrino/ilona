'use client';

import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChats, useSocket, useCreateDirectChat, useStudentAdmin, useStudentUnreadCounts } from '../hooks';
import { useMyTeachers } from '@/features/students/hooks/useStudents';
import { useChatStore } from '../store/chat.store';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';
import { formatMessagePreview } from '../utils';
import { Badge } from '@/shared/components/ui/badge';

interface StudentChatListProps {
  onSelectChat: (chat: Chat) => void;
}

export function StudentChatList({ onSelectChat }: StudentChatListProps) {
  const { user } = useAuthStore();
  const { activeChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'admin' | 'chats' | 'teachers'>('chats');

  // Fetch chats from API
  const { data: chats = [], isLoading: isLoadingChats } = useChats();

  // Fetch assigned teachers
  const { data: teachers = [], isLoading: isLoadingTeachers } = useMyTeachers();

  // Fetch admin
  const { data: admin, isLoading: isLoadingAdmin } = useStudentAdmin();

  // Get unread counts for tabs
  const { counts: unreadCounts } = useStudentUnreadCounts();

  // Create direct chat mutation
  const createDirectChat = useCreateDirectChat();

  // Socket for online status
  const { isConnected, isUserOnline } = useSocket();

  // Filter chats by search and exclude Admin from chats list
  const filteredChats = chats.filter((chat) => {
    // Filter out Admin from chats list - Admin should only appear in Admin section
    if (chat.type === 'DIRECT') {
      const otherParticipant = chat.participants.find((p) => p.userId !== user?.id);
      if (otherParticipant?.user.role === 'ADMIN') {
        return false;
      }
    }

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

  // Filter teachers by search
  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return teacher.name.toLowerCase().includes(query);
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

  // Get unread count for a specific user ID
  const getUserUnreadCount = (userId: string): number => {
    const chat = chats.find((c) => {
      if (c.type !== 'DIRECT') return false;
      return c.participants.some((p) => p.userId === userId);
    });
    return chat?.unreadCount || 0;
  };

  // Handle teacher click - create or open DM
  const handleTeacherClick = async (teacherUserId: string) => {
    try {
      // Check if chat already exists
      const existingChat = chats.find((chat) => {
        if (chat.type !== 'DIRECT') return false;
        return chat.participants.some((p) => p.userId === teacherUserId);
      });

      if (existingChat) {
        onSelectChat(existingChat);
        setActiveTab('chats');
      } else {
        // Create new direct chat
        const newChat = await createDirectChat.mutateAsync(teacherUserId);
        onSelectChat(newChat);
        setActiveTab('chats');
      }
    } catch (error) {
      console.error('Failed to open teacher chat:', error);
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

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('chats')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
              activeTab === 'chats'
                ? 'bg-primary/20 text-primary'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            Chats
            {unreadCounts.chats > 0 && (
              <Badge 
                variant="error" 
                className={cn(
                  "min-w-[20px] h-5 flex items-center justify-center px-1.5",
                  activeTab === 'chats' && "bg-red-500 text-white"
                )}
              >
                {unreadCounts.chats}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
              activeTab === 'teachers'
                ? 'bg-primary/20 text-primary'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            My Teachers
            {unreadCounts.teachers > 0 && (
              <Badge 
                variant="error" 
                className={cn(
                  "min-w-[20px] h-5 flex items-center justify-center px-1.5",
                  activeTab === 'teachers' && "bg-red-500 text-white"
                )}
              >
                {unreadCounts.teachers}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
              activeTab === 'admin'
                ? 'bg-primary/20 text-primary'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            Admin
            {unreadCounts.admin > 0 && (
              <Badge 
                variant="error" 
                className={cn(
                  "min-w-[20px] h-5 flex items-center justify-center px-1.5",
                  activeTab === 'admin' && "bg-red-500 text-white"
                )}
              >
                {unreadCounts.admin}
              </Badge>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder={activeTab === 'admin' ? 'Search admin...' : activeTab === 'teachers' ? 'Search teachers...' : 'Search chats...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'admin' ? (
          // Admin section
          isLoadingAdmin ? (
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
          ) : !admin ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {searchQuery ? 'No admin found' : 'No admin available'}
              </p>
              <p className="text-xs text-slate-500">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Admin contact will appear here'}
              </p>
            </div>
          ) : (
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
                    <img
                      src={admin.avatarUrl}
                      alt={admin.name}
                      className="w-12 h-12 rounded-full object-cover"
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
                          {formatMessagePreview(admin.lastMessage)}
                        </p>
                        {(admin.unreadCount || 0) > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full flex-shrink-0">
                            {admin.unreadCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        Click to start conversation
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </div>
          )
        ) : activeTab === 'chats' ? (
          // Chats list
          isLoadingChats ? (
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
          )
        ) : (
          // Teachers list
          isLoadingTeachers ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {searchQuery ? 'No teachers found' : 'No assigned teachers'}
              </p>
              <p className="text-xs text-slate-500">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Your assigned teachers will appear here'}
              </p>
            </div>
          ) : (
            filteredTeachers.map((teacher) => {
              // Check if there's an existing chat with this teacher
              const existingChat = chats.find((chat) => {
                if (chat.type !== 'DIRECT') return false;
                return chat.participants.some((p) => p.userId === teacher.userId);
              });

              const isActive = activeChat?.id === existingChat?.id;
              const isOnline = existingChat
                ? isUserOnline(existingChat.id, teacher.userId)
                : false;

              return (
                <button
                  key={teacher.id}
                  onClick={() => handleTeacherClick(teacher.userId)}
                  disabled={createDirectChat.isPending}
                  className={cn(
                    'w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left',
                    isActive && 'bg-primary/10 hover:bg-primary/10',
                    createDirectChat.isPending && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {/* Avatar */}
                  <div className="relative">
                    {teacher.avatarUrl ? (
                      <img
                        src={teacher.avatarUrl}
                        alt={teacher.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-primary">
                        {teacher.firstName[0]}{teacher.lastName[0]}
                      </div>
                    )}
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-slate-900 truncate">
                        {teacher.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between">
                      {teacher.phone && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-500 truncate">
                            {teacher.phone}
                          </p>
                          {getUserUnreadCount(teacher.userId) > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full flex-shrink-0 min-w-[20px] text-center">
                              {getUserUnreadCount(teacher.userId)}
                            </span>
                          )}
                        </div>
                      )}
                      {existingChat && (
                        <span className="text-xs text-primary font-medium">
                          Chat exists
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )
        )}
      </div>
    </div>
  );
}



