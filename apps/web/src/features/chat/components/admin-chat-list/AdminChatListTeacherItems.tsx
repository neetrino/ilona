'use client';

import Image from 'next/image';
import { cn, formatPhoneForDisplay } from '@/shared/lib/utils';
import { Badge } from '@/shared/components/ui/badge';
import { getInitials } from '@/shared/components/ui/avatar';
import { OnlineStatusDot } from '../OnlineStatusDot';
import type { AdminChatListViewModel } from './admin-chat-list.types';

interface AdminChatListTeacherItemsProps {
  teachers: AdminChatListViewModel['sortedTeachers'];
  activeChat: AdminChatListViewModel['activeChat'];
  getUserUnreadCount: AdminChatListViewModel['getUserUnreadCount'];
  getUserOnlineStatus: AdminChatListViewModel['getUserOnlineStatus'];
  onSelectUser: AdminChatListViewModel['handleSelectUser'];
}

export function AdminChatListTeacherItems({
  teachers,
  activeChat,
  getUserUnreadCount,
  getUserOnlineStatus,
  onSelectUser,
}: AdminChatListTeacherItemsProps) {
  return (
    <div className="divide-y divide-slate-100">
      {teachers.map((teacher) => {
        const unread = getUserUnreadCount(teacher.id);
        const isActive =
          activeChat?.type === 'DIRECT' &&
          activeChat.participants.some((p) => p.userId === teacher.id);

        return (
          <button
            key={teacher.id}
            onClick={() => onSelectUser(teacher.id)}
            className={cn(
              'flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50',
              isActive && 'bg-primary/10 hover:bg-primary/10',
            )}
          >
            <div className="relative h-12 w-12 flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 font-semibold text-white">
                {teacher.avatarUrl ? (
                  <Image
                    src={teacher.avatarUrl}
                    alt={teacher.name}
                    width={48}
                    height={48}
                    className="h-full w-full rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  getInitials(teacher.name)
                )}
              </div>
              <OnlineStatusDot isOnline={getUserOnlineStatus(teacher.id)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-medium text-slate-900">{teacher.name}</h3>
                {unread > 0 && (
                  <Badge
                    variant="error"
                    className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center px-1.5"
                  >
                    {unread}
                  </Badge>
                )}
              </div>
              {teacher.phone && (
                <p className="truncate text-sm text-slate-500">{formatPhoneForDisplay(teacher.phone)}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
