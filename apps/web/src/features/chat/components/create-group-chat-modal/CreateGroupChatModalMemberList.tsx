'use client';

import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { getInitials } from '@/shared/components/ui/avatar';
import type { AdminChatAllUser } from '../../api/chat.api';
import type { CreateGroupChatModalViewModel } from './create-group-chat-modal.types';

interface CreateGroupChatModalMemberListProps {
  tChat: CreateGroupChatModalViewModel['tChat'];
  isLoading: boolean;
  debouncedSearch: string;
  selectableUsers: AdminChatAllUser[];
  selectedIds: Set<string>;
  toggleUser: (userId: string) => void;
}

export function CreateGroupChatModalMemberList({
  tChat,
  isLoading,
  debouncedSearch,
  selectableUsers,
  selectedIds,
  toggleUser,
}: CreateGroupChatModalMemberListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex animate-pulse items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="flex-1">
              <div className="mb-1 h-4 w-32 rounded bg-slate-200" />
              <div className="h-3 w-48 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (selectableUsers.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[#8b8b90]">
          {debouncedSearch ? tChat('noUsersFoundSearch') : tChat('noOtherUsersToAdd')}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[rgba(14,14,16,0.07)] rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white">
      {selectableUsers.map((user) => {
        const checked = selectedIds.has(user.id);
        return (
          <button
            key={user.id}
            type="button"
            onClick={() => toggleUser(user.id)}
            className={cn(
              'flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[#f6f6f7]',
              checked && 'bg-[#ddecff]/70',
            )}
          >
            <div
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                checked ? 'border-[#1010a3] bg-[#1010a3]' : 'border-slate-300',
              )}
            >
              {checked && (
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1010a3]/15 font-medium text-[#1010a3]">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="h-full w-full rounded-full object-cover"
                  unoptimized
                />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[#3b3b40]">{user.name}</p>
              <p className="truncate text-xs text-[#8b8b90]">
                {user.email} · {user.role}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
