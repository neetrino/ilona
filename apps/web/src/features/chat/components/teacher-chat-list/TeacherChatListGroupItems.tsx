'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { formatMessagePreview } from '../../utils';
import { getGroupIconComponent } from '@/features/groups';
import type { TeacherChatListViewModel } from './teacher-chat-list.types';

interface TeacherChatListGroupItemsProps {
  items: TeacherChatListViewModel['sortedGroupItems'];
  allChats: TeacherChatListViewModel['allChats'];
  activeChat: TeacherChatListViewModel['activeChat'];
  messagePreviewLabels: TeacherChatListViewModel['messagePreviewLabels'];
  formatTime: TeacherChatListViewModel['formatTime'];
  onSelectChat: TeacherChatListViewModel['onSelectChat'];
  onGroupClick: TeacherChatListViewModel['handleGroupClick'];
}

export function TeacherChatListGroupItems({
  items,
  allChats,
  activeChat,
  messagePreviewLabels,
  formatTime,
  onSelectChat,
  onGroupClick,
}: TeacherChatListGroupItemsProps) {
  const tChat = useTranslations('chat');

  return (
    <>
      {items.map((item) => {
        if (item.kind === 'custom') {
          const chat = item.chat;
          const fullChat = allChats.find((c) => c.id === chat.id);
          const unread = fullChat?.unreadCount ?? 0;
          const lastMsg = fullChat?.lastMessage ?? chat.lastMessage;
          const isActive =
            activeChat?.type === 'GROUP' && !activeChat?.groupId && activeChat?.id === chat.id;

          return (
            <button
              key={chat.id}
              onClick={() => onSelectChat(fullChat || chat)}
              className={cn(
                'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50',
                isActive && 'bg-primary/10 hover:bg-primary/10',
              )}
            >
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 font-semibold text-white">
                  {(chat.name || 'Group')[0]}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h3
                    className={cn(
                      'truncate font-medium',
                      unread > 0 ? 'text-slate-900' : 'text-slate-700',
                    )}
                  >
                    {chat.name || tChat('groupChatLabel')}
                  </h3>
                  <span className="flex-shrink-0 text-xs text-slate-500">
                    {formatTime(lastMsg?.createdAt || chat.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      'truncate text-sm',
                      unread > 0 ? 'font-medium text-slate-700' : 'text-slate-500',
                    )}
                  >
                    {formatMessagePreview(lastMsg, messagePreviewLabels)}
                  </p>
                  {unread > 0 && (
                    <span className="ml-2 flex-shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {unread}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">{tChat('groupChatLabel')}</p>
              </div>
            </button>
          );
        }

        const group = item.group;
        const isActive = activeChat?.groupId === group.id;
        const unread = Math.max(0, Number(group.unreadCount) || 0);
        const total = Math.max(0, Number(group.messageCount) || 0);
        const hasUnread = unread > 0;
        const showBadge = hasUnread;
        const count = hasUnread ? unread : total;
        const GroupListIcon = getGroupIconComponent(group.iconKey);

        return (
          <button
            key={group.id}
            onClick={() => onGroupClick(group.id, group.chatId)}
            className={cn(
              'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50',
              isActive && 'bg-primary/10 hover:bg-primary/10',
            )}
          >
            <div className="relative flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 font-semibold text-white">
                {GroupListIcon ? (
                  <GroupListIcon
                    className="text-white"
                    size={24}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                ) : (
                  group.name[0]
                )}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <h3
                  className={cn(
                    'min-w-0 flex-1 truncate font-medium',
                    hasUnread ? 'text-slate-900' : 'text-slate-700',
                  )}
                  title={group.name}
                >
                  {group.name}
                </h3>
                <span className="flex-shrink-0 text-xs text-slate-500">
                  {formatTime(group.lastMessage?.createdAt || group.updatedAt)}
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <p
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    hasUnread ? 'font-medium text-slate-700' : 'text-slate-500',
                  )}
                >
                  {formatMessagePreview(group.lastMessage, messagePreviewLabels)}
                </p>
                {showBadge && (
                  <span
                    className="ml-1 min-w-[1.25rem] flex-shrink-0 rounded-full bg-primary px-2 py-0.5 text-center text-xs text-primary-foreground"
                    aria-label={tChat('unreadCount', { count })}
                  >
                    {count}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                {group.level
                  ? tChat('classGroupWithLevel', { level: group.level })
                  : tChat('classGroup')}
              </p>
            </div>
          </button>
        );
      })}
    </>
  );
}
