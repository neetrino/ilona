'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useAdminStudents, useAdminTeachers, useAdminGroups, useCreateDirectChat, useAdminUnreadCounts, useChats } from '../hooks';
import { useChatStore } from '../store/chat.store';
import { fetchGroupChat, createDirectChat } from '../api/chat.api';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/components/ui/badge';

type AdminChatTab = 'students' | 'teachers' | 'groups';

interface AdminChatListProps {
  activeTab: AdminChatTab | null;
  onTabChange: (tab: AdminChatTab) => void;
  onSelectChat: (chat: Chat) => void;
}
console.log("h3llo");

export function AdminChatList({ activeTab, onTabChange, onSelectChat }: AdminChatListProps) {
  const { user } = useAuthStore();
  const { activeChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const createDirectChatMutation = useCreateDirectChat();
  const { counts: unreadCounts } = useAdminUnreadCounts();
  const { data: chats = [] } = useChats();

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

  const isLoading = activeTab === 'students' ? isLoadingStudents : 
                    activeTab === 'teachers' ? isLoadingTeachers : 
                    activeTab === 'groups' ? isLoadingGroups :
                    false;

  // Create a map of groupId -> unreadCount for GROUP type chats
  const groupUnreadMap = useMemo(() => {
    const map = new Map<string, number>();
    chats.forEach((chat) => {
      if (chat.type === 'GROUP' && chat.groupId && (chat.unreadCount || 0) > 0) {
        map.set(chat.groupId, chat.unreadCount || 0);
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

  // Get avatar initials
  const getAvatar = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || '?';
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
            {searchQuery ? 'No students found' : 'No students available'}
          </p>
          <p className="text-xs text-slate-500">
            {searchQuery ? 'Try a different search term' : 'Students will appear here'}
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-slate-100">
        {students.map((student) => (
          <button
            key={student.id}
            onClick={() => handleSelectUser(student.id)}
            className={cn(
              'w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left',
              activeChat?.type === 'DIRECT' && activeChat?.participants.some(p => p.userId === student.id) && 'bg-primary/10 hover:bg-primary/10'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold flex-shrink-0">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                getAvatar(student.name)
              )}
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
                <p className="text-sm text-slate-500 truncate">{student.phone}</p>
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
            {searchQuery ? 'No teachers found' : 'No teachers available'}
          </p>
          <p className="text-xs text-slate-500">
            {searchQuery ? 'Try a different search term' : 'Teachers will appear here'}
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-slate-100">
        {teachers.map((teacher) => (
          <button
            key={teacher.id}
            onClick={() => handleSelectUser(teacher.id)}
            className={cn(
              'w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left',
              activeChat?.type === 'DIRECT' && activeChat?.participants.some(p => p.userId === teacher.id) && 'bg-primary/10 hover:bg-primary/10'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {teacher.avatarUrl ? (
                <img src={teacher.avatarUrl} alt={teacher.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                getAvatar(teacher.name)
              )}
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
                <p className="text-sm text-slate-500 truncate">{teacher.phone}</p>
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

    if (groups.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 10a3 3 0 11-6 0 3 3 0 016 0zm5 2a3 3 0 11-6 0 3 3 0 016 0zM9 20h5v-2a3 3 0 00-5.196-2.121M9 20H4v-2a3 3 0 015.196-2.121M9 20v-2a3 3 0 015.196-2.121" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">
            {searchQuery ? 'No groups found' : 'No groups available'}
          </p>
          <p className="text-xs text-slate-500">
            {searchQuery ? 'Try a different search term' : 'Groups will appear here'}
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-slate-100">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => handleSelectGroup(group.id)}
            className={cn(
              'w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left',
              activeChat?.type === 'GROUP' && activeChat?.groupId === group.id && 'bg-primary/10 hover:bg-primary/10'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {getAvatar(group.name)}
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
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="p-2 border-b border-slate-200">
        <div className="flex gap-1">
          <button
            onClick={() => onTabChange('groups')}
            className={cn(
              'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
              activeTab === 'groups'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            Groups
            {unreadCounts.groups > 0 && (
              <Badge 
                variant="error" 
                className={cn(
                  "min-w-[18px] h-4 flex items-center justify-center px-1 text-xs",
                  activeTab === 'groups' && "bg-red-500 text-white"
                )}
              >
                {unreadCounts.groups}
              </Badge>
            )}
          </button>
          <button
            onClick={() => onTabChange('teachers')}
            className={cn(
              'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
              activeTab === 'teachers'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            Teachers
            {unreadCounts.teachers > 0 && (
              <Badge 
                variant="error" 
                className={cn(
                  "min-w-[18px] h-4 flex items-center justify-center px-1 text-xs",
                  activeTab === 'teachers' && "bg-red-500 text-white"
                )}
              >
                {unreadCounts.teachers}
              </Badge>
            )}
          </button>
          <button
            onClick={() => onTabChange('students')}
            className={cn(
              'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
              activeTab === 'students'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            Students
            {unreadCounts.students > 0 && (
              <Badge 
                variant="error" 
                className={cn(
                  "min-w-[18px] h-4 flex items-center justify-center px-1 text-xs",
                  activeTab === 'students' && "bg-red-500 text-white"
                )}
              >
                {unreadCounts.students}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      {activeTab && (
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {!activeTab ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              Select a category
            </p>
            <p className="text-xs text-slate-500">
              Choose Groups, Teachers, or Students to start browsing
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'students' && renderStudents()}
            {activeTab === 'teachers' && renderTeachers()}
            {activeTab === 'groups' && renderGroups()}
          </>
        )}
      </div>
    </div>
  );
}

