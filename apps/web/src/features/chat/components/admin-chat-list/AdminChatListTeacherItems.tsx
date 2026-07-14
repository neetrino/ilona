'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { formatPhoneForDisplay } from '@/shared/lib/utils';
import { getInitials } from '@/shared/components/ui/avatar';
import { formatChatListPreview } from '../../utils';
import { OnlineStatusDot } from '../OnlineStatusDot';
import { ChatUnreadBadge } from '../ChatUnreadBadge';
import {
  ADMIN_CHAT_LIST_ITEM_SUBTITLE_CLASS,
  ADMIN_CHAT_LIST_ITEM_TITLE_CLASS,
  getAdminChatListItemClass,
} from './admin-chat-list.theme';
import type { AdminChatListViewModel } from './admin-chat-list.types';

interface AdminChatListTeacherItemsProps {
  teachers: AdminChatListViewModel['sortedTeachers'];
  activeChat: AdminChatListViewModel['activeChat'];
  getUserUnreadCount: AdminChatListViewModel['getUserUnreadCount'];
  getUserOnlineStatus: AdminChatListViewModel['getUserOnlineStatus'];
  getUserLastMessage: AdminChatListViewModel['getUserLastMessage'];
  onSelectUser: AdminChatListViewModel['handleSelectUser'];
}

export function AdminChatListTeacherItems({
  teachers,
  activeChat,
  getUserUnreadCount,
  getUserOnlineStatus,
  getUserLastMessage,
  onSelectUser,
}: AdminChatListTeacherItemsProps) {
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
      {teachers.map((teacher) => {
        const unread = getUserUnreadCount(teacher.id);
        const lastMessage = getUserLastMessage(teacher.id);
        const isActive =
          activeChat?.type === 'DIRECT' &&
          activeChat.participants.some((p) => p.userId === teacher.id);
        const phoneFallback = teacher.phone
          ? formatPhoneForDisplay(teacher.phone)
          : undefined;

        return (
          <button
            key={teacher.id}
            onClick={() => onSelectUser(teacher.id)}
            className={getAdminChatListItemClass(isActive)}
          >
            <div className="relative h-11 w-11 flex-shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-sm font-semibold text-white">
                {teacher.avatarUrl ? (
                  <Image
                    src={teacher.avatarUrl}
                    alt={teacher.name}
                    width={44}
                    height={44}
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
                <h3 className={ADMIN_CHAT_LIST_ITEM_TITLE_CLASS}>{teacher.name}</h3>
                <ChatUnreadBadge
                  count={unread}
                  label={tChat('unreadCount', { count: unread })}
                />
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
