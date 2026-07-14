'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { cn } from '@/shared/lib/utils';
import { getFullApiUrl } from '@/shared/lib/api-url-utils';
import { resolveChatAvatarUrl } from '../../utils/chat-avatar';
import { formatChatListPreview } from '../../utils';
import { ChatUnreadBadge } from '../ChatUnreadBadge';
import type { TeacherChatListViewModel } from './teacher-chat-list.types';

interface TeacherChatListAdminItemProps {
  admin: NonNullable<TeacherChatListViewModel['admin']>;
  activeChat: TeacherChatListViewModel['activeChat'];
  createDirectChatPending: boolean;
  messagePreviewLabels: TeacherChatListViewModel['messagePreviewLabels'];
  formatTime: TeacherChatListViewModel['formatTime'];
  onAdminClick: TeacherChatListViewModel['handleAdminClick'];
}

export function TeacherChatListAdminItem({
  admin,
  activeChat,
  createDirectChatPending,
  messagePreviewLabels,
  formatTime,
  onAdminClick,
}: TeacherChatListAdminItemProps) {
  const tChat = useTranslations('chat');
  const { data: logoData } = useLogo();
  const adminAvatarUrl = resolveChatAvatarUrl(
    admin.avatarUrl,
    'ADMIN',
    getFullApiUrl(logoData?.logoUrl),
  );

  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => onAdminClick(admin.id, admin.chatId || null)}
        disabled={createDirectChatPending}
        className={cn(
          'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50',
          activeChat?.id === admin.chatId && 'bg-primary/10 hover:bg-primary/10',
          createDirectChatPending && 'cursor-not-allowed opacity-50',
        )}
      >
        <div className="relative">
          {adminAvatarUrl ? (
            <Image
              src={adminAvatarUrl}
              alt={admin.name}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 font-semibold text-white">
              {admin.firstName?.[0]}
              {admin.lastName?.[0]}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <h3
              className={cn(
                'truncate font-medium',
                (admin.unreadCount || 0) > 0 ? 'text-slate-900' : 'text-slate-700',
              )}
            >
              {admin.name}
            </h3>
            {admin.chatId && admin.updatedAt && (
              <span className="flex-shrink-0 text-xs text-slate-500">
                {formatTime(admin.lastMessage?.createdAt || admin.updatedAt)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            {admin.chatId ? (
              <>
                <p
                  className={cn(
                    'truncate text-sm',
                    (admin.unreadCount || 0) > 0 ? 'font-medium text-slate-700' : 'text-slate-500',
                  )}
                >
                  {formatChatListPreview({
                    message: admin.lastMessage,
                    labels: messagePreviewLabels,
                    unreadCount: admin.unreadCount || 0,
                    unreadLabel:
                      (admin.unreadCount || 0) > 0
                        ? tChat('unreadCount', { count: admin.unreadCount || 0 })
                        : undefined,
                  })}
                </p>
                <ChatUnreadBadge
                  count={admin.unreadCount || 0}
                  className="ml-2"
                  label={tChat('unreadCount', { count: admin.unreadCount || 0 })}
                />
              </>
            ) : (
              <p className="text-sm italic text-slate-500">{tChat('clickToStartConversation')}</p>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
