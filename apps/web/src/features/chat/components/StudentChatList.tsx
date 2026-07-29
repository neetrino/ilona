'use client';

import { useState, useMemo, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { useChats, useSocket, useCreateDirectChat, useStudentAdmin } from '../hooks';
import { useChatStore } from '../store/chat.store';
import { useMyTeachers } from '@/features/students/hooks/useStudents';
import type { Chat } from '../types';
import type { AssignedTeacher } from '@/features/students/api/students.api';
import type { StudentAdmin } from '../api/chat-api/chat-api.types';
import { cn } from '@/shared/lib/utils';
import { getFullApiUrl } from '@/shared/lib/api-url-utils';
import { getChatTheme } from '../lib/chat-theme';
import { formatChatListPreview } from '../utils';
import { resolveChatAvatarUrl } from '../utils/chat-avatar';
import { formatChatListTime, sortChatListItems } from '../utils/chat-utils';
import Image from 'next/image';
import { formatDisplayName, getInitials, getInitialsFromParts } from '@/shared/components/ui/avatar';
import { OnlineStatusDot } from './OnlineStatusDot';
import { ChatUnreadBadge } from './ChatUnreadBadge';

type ListItem =
  | { type: 'chat'; chat: Chat }
  | { type: 'teacher_placeholder'; teacher: AssignedTeacher }
  | { type: 'admin_placeholder'; admin: StudentAdmin };

interface StudentChatListProps {
  onSelectChat: (chat: Chat) => void;
}

export function StudentChatList({ onSelectChat }: StudentChatListProps) {
  const tChat = useTranslations('chat');
  const locale = useLocale();
  const ui = getChatTheme('student');
  const { user } = useAuthStore();
  const { data: logoData } = useLogo();
  const brandLogoUrl = getFullApiUrl(logoData?.logoUrl);
  const { activeChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch chats from API (all chats - 1:1 and group, including with admin)
  const { data: chats = [], isLoading: isLoadingChats } = useChats();
  // Assigned teacher(s) so they always appear in the list (with or without existing chat)
  const { data: teachers = [], isLoading: isLoadingTeachers } = useMyTeachers(true);
  // Admin contact — always visible so students can message support from day one
  const { data: admin, isLoading: isLoadingAdmin } = useStudentAdmin();
  const createDirectChat = useCreateDirectChat();

  // Shared presence (all roles / hook instances)
  useSocket();
  const presenceByUserId = useChatStore((state) => state.presenceByUserId);

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

  // Chats filtered and sorted by recency
  const filteredChats = useMemo(() => {
    let list = chats.filter((chat) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      if (chat.name?.toLowerCase().includes(query)) return true;
      if (chat.group?.name?.toLowerCase().includes(query)) return true;
      return chat.participants.some((p) => {
        const fullName = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
        return fullName.includes(query);
      });
    });
    list = sortChatListItems(list, (chat) => chat);
    return list;
  }, [chats, searchQuery]);

  // Unified list: admin + assigned teachers (placeholders) + all other chats
  const listItems = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    const directPartnerIdsWithChat = new Set<string>();
    const q = searchQuery?.toLowerCase() ?? '';

    for (const chat of filteredChats) {
      if (chat.type === 'DIRECT') {
        const other = chat.participants.find((p) => p.userId !== user?.id);
        if (other?.userId) directPartnerIdsWithChat.add(other.userId);
      }
    }

    // Admin always appears (placeholder until DM exists / is in the list)
    if (admin && !directPartnerIdsWithChat.has(admin.id)) {
      const adminName = admin.name.toLowerCase();
      if (!q || adminName.includes(q) || 'admin'.includes(q) || 'ադմին'.includes(q)) {
        items.push({ type: 'admin_placeholder', admin });
      }
    }

    // Add teacher placeholders for assigned teachers who don't have a chat in the list yet
    for (const teacher of teachers) {
      if (directPartnerIdsWithChat.has(teacher.userId)) continue;
      if (q && !teacher.name.toLowerCase().includes(q)) continue;
      items.push({ type: 'teacher_placeholder', teacher });
    }

    // Add all chats (group + direct, including with teacher/admin)
    for (const chat of filteredChats) {
      items.push({ type: 'chat', chat });
    }

    return sortChatListItems(items, (item) => {
      if (item.type === 'chat') {
        return item.chat;
      }
      if (item.type === 'admin_placeholder') {
        return {
          unreadCount: item.admin.unreadCount || 0,
          lastMessage: item.admin.lastMessage ?? undefined,
          updatedAt: item.admin.updatedAt ?? undefined,
        };
      }
      return { unreadCount: 0 };
    });
  }, [filteredChats, teachers, admin, user?.id, searchQuery]);

  const openOrCreateDirectChat = useCallback(
    (partnerUserId: string, existingChatId: string | null) => {
      if (existingChatId) {
        const existing = chats.find((chat) => chat.id === existingChatId);
        if (existing) {
          onSelectChat(existing);
          return;
        }
      }
      createDirectChat.mutate(partnerUserId, {
        onSuccess: (newChat) => onSelectChat(newChat),
      });
    },
    [chats, createDirectChat, onSelectChat],
  );

  // Get chat display info
  const getChatInfo = (chat: Chat) => {
    if (chat.type === 'GROUP') {
      return {
        name: chat.name || chat.group?.name || tChat('groupChat'),
        avatar: chat.name?.[0] || chat.group?.name?.[0] || 'G',
        avatarUrl: null,
        isGroup: true,
      };
    }

    // Direct chat - show other participant
    const otherParticipant = chat.participants.find((p) => p.userId !== user?.id);
    const name = otherParticipant
      ? formatDisplayName(otherParticipant.user.firstName, otherParticipant.user.lastName)
      : tChat('unknownUser');

    return {
      name,
      avatar: otherParticipant
        ? getInitialsFromParts(otherParticipant.user.firstName, otherParticipant.user.lastName)
        : '?',
      avatarUrl: resolveChatAvatarUrl(
        otherParticipant?.user.avatarUrl,
        otherParticipant?.user.role,
        brandLogoUrl,
      ),
      isGroup: false,
      otherUserId: otherParticipant?.userId,
    };
  };

  const formatTime = (dateStr?: string) =>
    formatChatListTime(dateStr, locale, tChat('yesterday'));

  const isLoading = isLoadingChats || isLoadingTeachers || isLoadingAdmin;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
        <div className="sticky top-0 z-20 bg-white">
          <div className="border-b border-[rgba(14,14,16,0.07)] px-3 pb-3 pt-2">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b90]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                placeholder={tChat('searchChats')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] bg-white py-2 pl-9 pr-4 text-[16px] text-[#3b3b40] placeholder:text-[#8b8b90] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15 lg:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Unified chat list: admin + teachers (or placeholder) + all chats */}
        <div>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className={cn('h-12 w-12 rounded-full', ui.skeleton)} />
                <div className="flex-1">
                  <div className={cn('mb-2 h-4 w-24 rounded', ui.skeleton)} />
                  <div className={cn('h-3 w-40 rounded', ui.skeleton)} />
                </div>
              </div>
            ))}
          </div>
          ) : listItems.length === 0 ? (
            <div className="p-8 text-center">
              <div
                className={cn(
                  'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full',
                  ui.emptyIcon,
                )}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className={cn('mb-1 text-sm font-medium', ui.body)}>
                {searchQuery ? tChat('noChatsFound') : tChat('noChatsYet')}
              </p>
              <p className={cn('text-xs', ui.muted)}>
                {searchQuery
                  ? tChat('tryDifferentSearch')
                  : tChat('conversationsAppearHere')}
              </p>
            </div>
          ) : (
            listItems.map((item) => {
              if (item.type === 'admin_placeholder') {
                const { admin: adminContact } = item;
                const isCreating = createDirectChat.isPending;
                const adminAvatarUrl = resolveChatAvatarUrl(
                  adminContact.avatarUrl,
                  'ADMIN',
                  brandLogoUrl,
                );
                return (
                  <button
                    key={`admin-${adminContact.id}`}
                    onClick={() =>
                      openOrCreateDirectChat(adminContact.id, adminContact.chatId || null)
                    }
                    disabled={isCreating}
                    className={cn(
                      'flex w-full items-start gap-3 p-4 text-left transition-colors',
                      ui.listHover,
                      isCreating && 'cursor-wait opacity-60',
                    )}
                  >
                    <div className="relative">
                      {adminAvatarUrl ? (
                        <Image
                          src={adminAvatarUrl}
                          alt={adminContact.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-full font-semibold text-white',
                            ui.avatar,
                          )}
                        >
                          {getInitialsFromParts(adminContact.firstName, adminContact.lastName)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <h3 className={cn('truncate font-medium', ui.body)}>{adminContact.name}</h3>
                      </div>
                      <p className={cn('truncate text-sm', ui.muted)}>
                        {isCreating ? tChat('openingChat') : tChat('clickToStartConversation')}
                      </p>
                    </div>
                  </button>
                );
              }

              if (item.type === 'teacher_placeholder') {
                const { teacher } = item;
                const isCreating = createDirectChat.isPending;
                return (
                  <button
                    key={`teacher-${teacher.userId}`}
                    onClick={() => {
                      createDirectChat.mutate(teacher.userId, {
                        onSuccess: (newChat) => onSelectChat(newChat),
                      });
                    }}
                    disabled={isCreating}
                    className={cn(
                      'flex w-full items-start gap-3 p-4 text-left transition-colors',
                      ui.listHover,
                      isCreating && 'cursor-wait opacity-60',
                    )}
                  >
                    <div className="relative">
                      {teacher.avatarUrl ? (
                        <Image
                          src={teacher.avatarUrl}
                          alt={teacher.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-full font-semibold text-white',
                            ui.avatar,
                          )}
                        >
                          {getInitials(teacher.name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={cn('truncate font-medium', ui.body)}>{teacher.name}</h3>
                      </div>
                      <p className={cn('truncate text-sm', ui.muted)}>
                        {isCreating ? tChat('openingChat') : tChat('myTeacherTapToMessage')}
                      </p>
                    </div>
                  </button>
                );
              }

              const chat = item.chat;
              const info = getChatInfo(chat);
              const isActive = activeChat?.id === chat.id;
              const hasUnread = (chat.unreadCount || 0) > 0;
              const isOnline = info.otherUserId
                ? Boolean(presenceByUserId[info.otherUserId]?.isOnline)
                : false;

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={cn(
                    'flex w-full items-start gap-3 p-4 text-left transition-colors',
                    ui.listHover,
                    isActive && ui.listActive,
                  )}
                >
                  <div className="relative">
                    {info.avatarUrl ? (
                      <Image
                        src={info.avatarUrl}
                        alt={info.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold',
                          info.isGroup
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                            : ui.avatar,
                        )}
                      >
                        {info.avatar}
                      </div>
                    )}
                    {!info.isGroup && <OnlineStatusDot isOnline={isOnline} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={cn(
                          'truncate font-medium',
                          hasUnread ? 'text-[#1010a3]' : ui.body,
                        )}
                      >
                        {info.name}
                      </h3>
                      <span className={cn('flex-shrink-0 text-xs', ui.muted)}>
                        {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          'truncate text-sm',
                          hasUnread ? 'font-medium text-[#3b3b40]' : ui.muted,
                        )}
                      >
                        {formatChatListPreview({
                          message: chat.lastMessage,
                          labels: messagePreviewLabels,
                          unreadCount: chat.unreadCount || 0,
                          unreadLabel: hasUnread
                            ? tChat('unreadCount', { count: chat.unreadCount || 0 })
                            : undefined,
                          isGroup: info.isGroup,
                          currentUserId: user?.id,
                        })}
                      </p>
                      <ChatUnreadBadge
                        count={chat.unreadCount || 0}
                        className="ml-2"
                        label={tChat('unreadCount', { count: chat.unreadCount || 0 })}
                      />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
