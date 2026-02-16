'use client';

import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useTeacherGroups, useTeacherStudents, useTeacherAdmin, useSocket, useCreateDirectChat } from '../hooks';
import { fetchGroupChat } from '../api/chat.api';
import { useChatStore } from '../store/chat.store';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';
import { formatMessagePreview } from '../utils';

interface TeacherChatListProps {
  onSelectChat: (chat: Chat) => void;
}

export function TeacherChatList({ onSelectChat }: TeacherChatListProps) {
  const { user } = useAuthStore();
  const { activeChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'groups' | 'students'>('groups');

  // Fetch teacher's groups and students
  const { data: groups = [], isLoading: isLoadingGroups } = useTeacherGroups(
    activeTab === 'groups' ? searchQuery : undefined
  );
  const { data: students = [], isLoading: isLoadingStudents } = useTeacherStudents(
    activeTab === 'students' ? searchQuery : undefined
  );
  const { data: admin, isLoading: isLoadingAdmin } = useTeacherAdmin();

  // Create direct chat mutation
  const createDirectChat = useCreateDirectChat();

  // Socket for online status
  const { isConnected, isUserOnline } = useSocket();

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

  // Handle group click - fetch group chat
  const handleGroupClick = async (groupId: string, chatId: string | null) => {
    try {
      if (chatId) {
        // Chat exists, fetch it
        const chat = await fetchGroupChat(groupId);
        onSelectChat(chat);
      } else {
        // Chat doesn't exist yet, fetch group chat (it will be created if needed)
        const chat = await fetchGroupChat(groupId);
        onSelectChat(chat);
      }
    } catch (error) {
      console.error('Failed to open group chat:', error);
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

  const isLoading = activeTab === 'groups' ? isLoadingGroups : isLoadingStudents;
  const hasData = activeTab === 'groups' ? groups.length > 0 : students.length > 0;
  const hasAdmin = admin !== null && admin !== undefined;

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
            onClick={() => {
              setActiveTab('groups');
              setSearchQuery(''); // Clear search when switching tabs
            }}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              activeTab === 'groups'
                ? 'bg-primary/20 text-primary'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            Groups
          </button>
          <button
            onClick={() => {
              setActiveTab('students');
              setSearchQuery(''); // Clear search when switching tabs
            }}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              activeTab === 'students'
                ? 'bg-primary/20 text-primary'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            Students
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder={activeTab === 'groups' ? 'Search groups...' : 'Search students...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Admin Contact - Always show at top if available */}
        {hasAdmin && admin && (
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
        )}

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
                ? `No ${activeTab === 'groups' ? 'groups' : 'students'} found` 
                : `No assigned ${activeTab === 'groups' ? 'groups' : 'students'}`}
            </p>
            <p className="text-xs text-slate-500">
              {searchQuery 
                ? 'Try a different search term' 
                : `Your assigned ${activeTab === 'groups' ? 'groups' : 'students'} will appear here`}
            </p>
          </div>
        ) : activeTab === 'groups' ? (
          // Groups list
          groups.map((group) => {
            const isActive = activeChat?.groupId === group.id;
            const hasUnread = (group.unreadCount || 0) > 0;

            return (
              <button
                key={group.id}
                onClick={() => handleGroupClick(group.id, group.chatId)}
                className={cn(
                  'w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left',
                  isActive && 'bg-primary/10 hover:bg-primary/10'
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br from-purple-500 to-purple-600">
                    {group.name[0]}
                  </div>
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
                      {group.name}
                    </h3>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {formatTime(group.lastMessage?.createdAt || group.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        'text-sm truncate',
                        hasUnread ? 'text-slate-700 font-medium' : 'text-slate-500'
                      )}
                    >
                      {formatMessagePreview(group.lastMessage)}
                    </p>
                    {hasUnread && (
                      <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full flex-shrink-0">
                        {group.unreadCount}
                      </span>
                    )}
                  </div>
                  {group.level && (
                    <p className="text-xs text-slate-400 mt-1">
                      {group.level}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          // Students list
          students.map((student) => {
            const isActive = activeChat?.id === student.chatId;
            const hasUnread = (student.unreadCount || 0) > 0;
            const isOnline = student.chatId
              ? isUserOnline(student.chatId, student.id)
              : false;
            const studentName = `${student.firstName} ${student.lastName}`;
            const initials = `${student.firstName[0]}${student.lastName[0]}`;

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
                    <img
                      src={student.avatarUrl}
                      alt={studentName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-primary">
                      {initials}
                    </div>
                  )}
                  {isOnline && (
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
                          {formatMessagePreview(student.lastMessage)}
                        </p>
                        {hasUnread && (
                          <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full flex-shrink-0">
                            {student.unreadCount}
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
            );
          })
        )}
      </div>
    </div>
  );
}

