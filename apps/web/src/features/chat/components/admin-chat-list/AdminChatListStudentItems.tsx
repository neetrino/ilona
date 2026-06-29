'use client';

import Image from 'next/image';
import { cn, formatPhoneForDisplay } from '@/shared/lib/utils';
import { Badge } from '@/shared/components/ui/badge';
import { getInitials } from '@/shared/components/ui/avatar';
import { OnlineStatusDot } from '../OnlineStatusDot';
import type { AdminChatListViewModel } from './admin-chat-list.types';

interface AdminChatListStudentItemsProps {
  students: AdminChatListViewModel['sortedStudents'];
  activeChat: AdminChatListViewModel['activeChat'];
  getUserUnreadCount: AdminChatListViewModel['getUserUnreadCount'];
  getUserOnlineStatus: AdminChatListViewModel['getUserOnlineStatus'];
  onSelectUser: AdminChatListViewModel['handleSelectUser'];
}

export function AdminChatListStudentItems({
  students,
  activeChat,
  getUserUnreadCount,
  getUserOnlineStatus,
  onSelectUser,
}: AdminChatListStudentItemsProps) {
  return (
    <div className="divide-y divide-slate-100">
      {students.map((student) => {
        const unread = getUserUnreadCount(student.id);
        const isActive =
          activeChat?.type === 'DIRECT' &&
          activeChat.participants.some((p) => p.userId === student.id);

        return (
          <button
            key={student.id}
            onClick={() => onSelectUser(student.id)}
            className={cn(
              'flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50',
              isActive && 'bg-primary/10 hover:bg-primary/10',
            )}
          >
            <div className="relative h-12 w-12 flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-semibold text-white">
                {student.avatarUrl ? (
                  <Image
                    src={student.avatarUrl}
                    alt={student.name}
                    width={48}
                    height={48}
                    className="h-full w-full rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  getInitials(student.name)
                )}
              </div>
              <OnlineStatusDot isOnline={getUserOnlineStatus(student.id)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-medium text-slate-900">{student.name}</h3>
                {unread > 0 && (
                  <Badge
                    variant="error"
                    className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center px-1.5"
                  >
                    {unread}
                  </Badge>
                )}
              </div>
              {student.phone && (
                <p className="truncate text-sm text-slate-500">{formatPhoneForDisplay(student.phone)}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
