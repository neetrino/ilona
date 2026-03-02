'use client';

import { useState, useEffect } from 'react';
import { useAdminAllUsers, useAddGroupChatMember, useAddCustomGroupChatMember } from '../hooks';
import type { Chat } from '../types';
import type { AdminChatAllUser } from '../api/chat.api';
import { cn } from '@/shared/lib/utils';
import Image from 'next/image';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  onMemberAdded?: (updatedChat: Chat) => void;
}

function getAvatar(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0]?.toUpperCase() || '?';
}

export function AddMembersModal({
  isOpen,
  onClose,
  chat,
  onMemberAdded,
}: AddMembersModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  const { data: users = [], isLoading } = useAdminAllUsers(
    isOpen ? debouncedSearch || undefined : undefined
  );
  const addGroupMember = useAddGroupChatMember();
  const addCustomGroupMember = useAddCustomGroupChatMember();

  const isCustomGroup = !chat.groupId;

  const participantIds = new Set(chat.participants?.map((p) => p.userId) ?? []);

  const handleAdd = async (user: AdminChatAllUser) => {
    if (participantIds.has(user.id)) return;
    try {
      if (isCustomGroup) {
        await addCustomGroupMember.mutateAsync({ chatId: chat.id, userId: user.id });
      } else {
        await addGroupMember.mutateAsync({ groupId: chat.groupId!, userId: user.id });
      }
      if (onMemberAdded) {
        const { fetchChat } = await import('../api/chat.api');
        const updated = await fetchChat(chat.id);
        onMemberAdded(updated);
      }
      // Keep modal open so admin can add more members
    } catch (_e) {
      // Error shown via mutation state / inline
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Add members</h3>
          <p className="text-sm text-slate-500 mt-1">
            Search and add any registered user to this group chat
          </p>
          <div className="mt-3 relative">
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
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-600">
                {debouncedSearch ? 'No users found. Try a different search.' : 'No users available.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((user) => {
                const alreadyIn = participantIds.has(user.id);
                const adding =
                  (addGroupMember.isPending && addGroupMember.variables?.userId === user.id) ||
                  (addCustomGroupMember.isPending && addCustomGroupMember.variables?.userId === user.id);
                return (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center gap-3 p-3 hover:bg-slate-50',
                      alreadyIn && 'bg-slate-50'
                    )}
                  >
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
                        {user.email}
                        {user.phone ? ` · ${user.phone}` : ''} · {user.role}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {alreadyIn ? (
                        <span className="text-xs text-slate-500 font-medium">In group</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdd(user)}
                          disabled={addGroupMember.isPending || addCustomGroupMember.isPending}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-sm font-medium',
                            'bg-primary text-primary-foreground hover:bg-primary/90',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                          )}
                        >
                          {adding ? 'Adding...' : 'Add'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(addGroupMember.isError || addCustomGroupMember.isError) && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100">
            <p className="text-sm text-red-700">
              {(addGroupMember.error || addCustomGroupMember.error) instanceof Error
                ? (addGroupMember.error || addCustomGroupMember.error)!.message
                : 'Failed to add member. Please try again.'}
            </p>
          </div>
        )}

        <div className="p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
