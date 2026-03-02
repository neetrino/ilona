'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAdminAllUsers, useAdminTeachers, useCreateCustomGroupChat } from '../hooks';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { AdminChatAllUser } from '../api/chat.api';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';
import Image from 'next/image';

interface CreateGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (chat: Chat) => void;
}

function getAvatar(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0]?.toUpperCase() || '?';
}

export function CreateGroupChatModal({
  isOpen,
  onClose,
  onCreated,
}: CreateGroupChatModalProps) {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setSearch('');
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const { data: users = [], isLoading } = useAdminAllUsers(
    isOpen ? debouncedSearch || undefined : undefined
  );
  const { data: teachers = [] } = useAdminTeachers(isOpen ? undefined : undefined);
  const createChat = useCreateCustomGroupChat();

  // Exclude current Admin from selection (creator is added automatically by backend)
  const selectableUsers = useMemo(
    () => (currentUserId ? users.filter((u) => u.id !== currentUserId) : users),
    [users, currentUserId]
  );

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const addAllTeachers = () => {
    const teacherIds = teachers
      .filter((t) => t.id !== currentUserId)
      .map((t) => t.id);
    setSelectedIds((prev) => new Set([...prev, ...teacherIds]));
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    try {
      const chat = await createChat.mutateAsync({
        name: trimmedName,
        participantIds: [...selectedIds],
      });
      onCreated(chat);
      onClose();
    } catch (_e) {
      // Error shown via mutation state
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Create Group Chat</h3>
          <p className="text-sm text-slate-500 mt-1">
            Create a standalone chat group and add any registered users. Not linked to classes.
          </p>
          <label className="block mt-3 text-sm font-medium text-slate-700">Group name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Teachers"
            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <div className="mt-3 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Members</label>
            {teachers.filter((t) => t.id !== currentUserId).length > 0 && (
              <button
                type="button"
                onClick={addAllTeachers}
                className="text-xs text-primary hover:text-primary/90 font-medium"
              >
                Add all teachers
              </button>
            )}
          </div>
          <div className="mt-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-1" />
                    <div className="h-3 bg-slate-200 rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : selectableUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-600">
                {debouncedSearch
                  ? 'No users found. Try a different search.'
                  : 'No other users to add. You are automatically added as the group creator.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {selectableUsers.map((user: AdminChatAllUser) => {
                const checked = selectedIds.has(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left',
                      checked && 'bg-primary/5'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                        checked ? 'bg-primary border-primary' : 'border-slate-300'
                      )}
                    >
                      {checked && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium flex-shrink-0">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="w-full h-full rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        getAvatar(user.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email} · {user.role}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {createChat.isError && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100">
            <p className="text-sm text-red-700">
              {createChat.error instanceof Error
                ? createChat.error.message
                : 'Failed to create group chat. Please try again.'}
            </p>
          </div>
        )}

        <div className="p-4 border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || createChat.isPending}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg text-sm font-medium',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {createChat.isPending ? 'Creating...' : 'Create Group Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
