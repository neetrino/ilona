'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/components/ui/badge';
import { getInitials } from '@/shared/components/ui/avatar';
import { getGroupIconComponent } from '@/features/groups';
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
              className={cn(
                'flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50',
                isActive && 'bg-primary/10 hover:bg-primary/10',
              )}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 font-semibold text-white">
                {getInitials(chat.name || tChat('groupDefault'))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-medium text-slate-900">
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
                <p className="truncate text-sm text-slate-500">
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
            className={cn(
              'flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50',
              isActive && 'bg-primary/10 hover:bg-primary/10',
            )}
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 font-semibold text-white">
              {GroupListIcon ? (
                <GroupListIcon className="text-white" size={24} strokeWidth={1.75} aria-hidden />
              ) : (
                getInitials(group.name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-medium text-slate-900">{group.name}</h3>
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
                <p className="truncate text-sm text-slate-500">{group.center.name}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
