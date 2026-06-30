'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/shared/components/ui/badge';
import { getInitials } from '@/shared/components/ui/avatar';
import { getGroupIconComponent } from '@/features/groups';
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
  onSelectChat: AdminChatListViewModel['onSelectChat'];
  onSelectGroup: AdminChatListViewModel['handleSelectGroup'];
}

export function AdminChatListGroupItems({
  items,
  groupUnreadMap,
  activeChat,
  onSelectChat,
  onSelectGroup,
}: AdminChatListGroupItemsProps) {
  const tChat = useTranslations('chat');

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => {
        if (item.kind === 'custom') {
          const chat = item.chat;
          const unread = groupUnreadMap.get(chat.id) || 0;
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
                  {tChat('groupChatParticipants', { count: chat.participants?.length ?? 0 })}
                </p>
              </div>
            </button>
          );
        }

        const group = item.group;
        const unread = groupUnreadMap.get(group.id) || 0;
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
                {unread > 0 && (
                  <Badge
                    variant="error"
                    className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center px-1.5"
                  >
                    {unread}
                  </Badge>
                )}
              </div>
              {group.center && (
                <p className={ADMIN_CHAT_LIST_ITEM_SUBTITLE_CLASS}>{group.center.name}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
