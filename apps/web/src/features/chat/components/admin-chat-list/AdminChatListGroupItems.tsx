'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getInitials } from '@/shared/components/ui/avatar';
import { getGroupIconComponent } from '@/features/groups';
import { formatChatListPreview } from '../../utils';
import { ChatUnreadBadge } from '../ChatUnreadBadge';
import {
  ADMIN_CHAT_LIST_ITEM_SUBTITLE_CLASS,
  ADMIN_CHAT_LIST_ITEM_TITLE_CLASS,
  getAdminChatListItemClass,
} from './admin-chat-list.theme';
import type { AdminChatListViewModel } from './admin-chat-list.types';

interface AdminChatListGroupItemsProps {
  items: AdminChatListViewModel['sortedGroupItems'];
  groupUnreadMap: AdminChatListViewModel['groupUnreadMap'];
  activeChat: AdminChatListViewModel['activeChat'];
  getGroupLastMessage: AdminChatListViewModel['getGroupLastMessage'];
  onSelectChat: AdminChatListViewModel['onSelectChat'];
  onSelectGroup: AdminChatListViewModel['handleSelectGroup'];
}

export function AdminChatListGroupItems({
  items,
  groupUnreadMap,
  activeChat,
  getGroupLastMessage,
  onSelectChat,
  onSelectGroup,
}: AdminChatListGroupItemsProps) {
  const tChat = useTranslations('chat');
  const currentUserId = useAuthStore((state) => state.user?.id);
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
      {items.map((item) => {
        if (item.kind === 'custom') {
          const chat = item.chat;
          const unread = groupUnreadMap.get(chat.id) || 0;
          const lastMessage = getGroupLastMessage(chat.id) ?? chat.lastMessage;
          const isActive =
            activeChat?.type === 'GROUP' && !activeChat.groupId && activeChat.id === chat.id;

          return (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={getAdminChatListItemClass(isActive)}
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-sm font-semibold text-white">
                {getInitials(chat.name || tChat('groupDefault'))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={ADMIN_CHAT_LIST_ITEM_TITLE_CLASS}>
                    {chat.name || tChat('groupChatLabel')}
                  </h3>
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
                    isGroup: true,
                    currentUserId,
                    emptyFallback: tChat('groupChatParticipants', {
                      count: chat.participants?.length ?? 0,
                    }),
                  })}
                </p>
              </div>
            </button>
          );
        }

        const group = item.group;
        const unread = groupUnreadMap.get(group.id) || 0;
        const lastMessage = getGroupLastMessage(group.id) ?? group.lastMessage ?? null;
        const isActive = activeChat?.type === 'GROUP' && activeChat.groupId === group.id;
        const GroupListIcon = getGroupIconComponent(group.iconKey);

        return (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className={getAdminChatListItemClass(isActive)}
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-sm font-semibold text-white">
              {GroupListIcon ? (
                <GroupListIcon className="text-white" size={24} strokeWidth={1.75} aria-hidden />
              ) : (
                getInitials(group.name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className={ADMIN_CHAT_LIST_ITEM_TITLE_CLASS}>{group.name}</h3>
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
                  isGroup: true,
                  currentUserId,
                  emptyFallback: group.center?.name,
                })}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
