'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { formatPhoneForDisplay } from '@/shared/lib/utils';
import { Badge } from '@/shared/components/ui/badge';
import { getInitials } from '@/shared/components/ui/avatar';
import { formatChatListPreview } from '../../utils';
import { OnlineStatusDot } from '../OnlineStatusDot';
import {
  ADMIN_CHAT_LIST_ITEM_SUBTITLE_CLASS,
  ADMIN_CHAT_LIST_ITEM_TITLE_CLASS,
  getAdminChatListItemClass,
} from './admin-chat-list.theme';
import type { AdminChatListViewModel } from './admin-chat-list.types';

interface AdminChatListStudentItemsProps {
  students: AdminChatListViewModel['sortedStudents'];
  activeChat: AdminChatListViewModel['activeChat'];
  getUserUnreadCount: AdminChatListViewModel['getUserUnreadCount'];
  getUserOnlineStatus: AdminChatListViewModel['getUserOnlineStatus'];
  getUserLastMessage: AdminChatListViewModel['getUserLastMessage'];
  onSelectUser: AdminChatListViewModel['handleSelectUser'];
}

export function AdminChatListStudentItems({
  students,
  activeChat,
  getUserUnreadCount,
  getUserOnlineStatus,
  getUserLastMessage,
  onSelectUser,
}: AdminChatListStudentItemsProps) {
  const tChat = useTranslations('chat');
  const messagePreviewLabels = useMemo(
    () => ({
      noMessagesYet: tChat('noMessagesYet'),
      voiceMessage: tChat('voiceMessage'),
      photo: tChat('photo'),
      video: tChat('video'),
      attachment: tChat('attachment'),
      systemMessage: tChat('systemMessage'),
      message: tChat('message'),
    }),
    [tChat],
  );

  return (
    <div className="divide-y divide-slate-100">
      {students.map((student) => {
        const unread = getUserUnreadCount(student.id);
        const lastMessage = getUserLastMessage(student.id);
        const isActive =
          activeChat?.type === 'DIRECT' &&
          activeChat.participants.some((p) => p.userId === student.id);
        const phoneFallback = student.phone
          ? formatPhoneForDisplay(student.phone)
          : undefined;

        return (
          <button
            key={student.id}
            onClick={() => onSelectUser(student.id)}
            className={getAdminChatListItemClass(isActive)}
          >
            <div className="relative h-11 w-11 flex-shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {student.avatarUrl ? (
                  <Image
                    src={student.avatarUrl}
                    alt={student.name}
                    width={44}
                    height={44}
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
                <h3 className={ADMIN_CHAT_LIST_ITEM_TITLE_CLASS}>{student.name}</h3>
                {unread > 0 && (
                  <Badge
                    variant="error"
                    className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center px-1.5"
                  >
                    {unread}
                  </Badge>
                )}
              </div>
              <p className={ADMIN_CHAT_LIST_ITEM_SUBTITLE_CLASS}>
                {formatChatListPreview({
                  message: lastMessage,
                  labels: messagePreviewLabels,
                  unreadCount: unread,
                  unreadLabel:
                    unread > 0 ? tChat('unreadCount', { count: unread }) : undefined,
                  emptyFallback: phoneFallback,
                })}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
