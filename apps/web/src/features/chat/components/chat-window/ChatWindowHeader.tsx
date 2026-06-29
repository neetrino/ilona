'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import type { ChatThemeTokens } from '../../lib/chat-theme';
import type { Chat } from '../../types';
import { ChatBackButton } from '../ChatBackButton';
import { MessageNavigationControls } from '../MessageNavigationControls';
import { OnlineStatusDot } from '../OnlineStatusDot';

interface ChatWindowHeaderProps {
  chat: Chat;
  ui: ChatThemeTokens;
  title: string;
  avatarUrl: string | null;
  avatarInitials: string;
  typingNames: string[];
  onlineStatus: boolean | null;
  isConnected: boolean;
  isMobileConversation: boolean;
  isAdminOrManager: boolean;
  isGroupChat: boolean;
  isTeacher: boolean;
  showMessageNavigation: boolean;
  navigationVariant: 'default' | 'student';
  onBack?: () => void;
  onAddMembers: () => void;
  onOpenVocabulary: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function ChatWindowHeader({
  chat,
  ui,
  title,
  avatarUrl,
  avatarInitials,
  typingNames,
  onlineStatus,
  isConnected,
  isMobileConversation,
  isAdminOrManager,
  isGroupChat,
  isTeacher,
  showMessageNavigation,
  navigationVariant,
  onBack,
  onAddMembers,
  onOpenVocabulary,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: ChatWindowHeaderProps) {
  const tChat = useTranslations('chat');

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 border-b p-3 min-[1367px]:gap-3 min-[1367px]:p-4',
        isMobileConversation && 'max-lg:sticky max-lg:top-0 max-lg:z-20',
        ui.border,
        ui.headerBg,
      )}
    >
      {onBack ? (
        <ChatBackButton
          onClick={onBack}
          className="shrink-0 lg:hidden"
          aria-label={tChat('backToChatList')}
        />
      ) : null}

      <div className="shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={title}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white',
              chat.type === 'GROUP'
                ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                : ui.avatar,
            )}
          >
            {avatarInitials}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2
          className={cn(
            'font-semibold leading-snug max-lg:line-clamp-2 max-lg:whitespace-normal max-lg:break-words min-[1367px]:truncate',
            ui.title,
          )}
        >
          {title}
        </h2>
        {typingNames.length > 0 ? (
          <p className={cn('text-xs', ui.typing)}>
            {tChat('typing', {
              names: typingNames.join(', '),
              verb: typingNames.length === 1 ? tChat('typingOne') : tChat('typingMany'),
            })}
          </p>
        ) : onlineStatus !== null ? (
          <p className={cn('text-xs', onlineStatus ? 'text-green-600' : ui.muted)}>
            {onlineStatus ? tChat('online') : tChat('offline')}
          </p>
        ) : (
          <p className={cn('text-xs', ui.muted)}>
            {tChat('participantsCount', { count: chat.participants.length })}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 min-[1367px]:gap-2">
        {isAdminOrManager && isGroupChat && (
          <button
            onClick={onAddMembers}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-[15px] px-2 py-2 text-sm font-medium transition-colors min-[1367px]:px-3 min-[1367px]:py-1.5',
              ui.ghostBtn,
            )}
            title={tChat('addMembers')}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3z"
              />
            </svg>
            <span className="hidden sm:inline">{tChat('addMembers')}</span>
          </button>
        )}
        {isTeacher && isGroupChat && (
          <button
            onClick={onOpenVocabulary}
            className="flex items-center gap-1.5 rounded-lg bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200"
            title={tChat('sendVocabularyTitle')}
          >
            <span>📚</span>
            <span className="hidden sm:inline">{tChat('vocabulary')}</span>
          </button>
        )}
        {showMessageNavigation ? (
          <MessageNavigationControls
            variant={navigationVariant}
            onPrevious={onPrevious}
            onNext={onNext}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
          />
        ) : null}
        <div className="flex shrink-0 items-center gap-1">
          <div className="flex h-9 w-7 shrink-0 items-center justify-center pl-1.5 min-[1367px]:w-9 min-[1367px]:pl-2">
            {chat.type === 'DIRECT' && onlineStatus !== null ? (
              <OnlineStatusDot
                variant="inline"
                isOnline={onlineStatus}
                title={onlineStatus ? tChat('online') : tChat('offline')}
              />
            ) : (
              <div
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-red-500',
                )}
                title={isConnected ? tChat('connected') : tChat('reconnecting')}
              />
            )}
          </div>
          <button
            type="button"
            className={cn(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[15px] transition-colors',
              ui.iconBtn,
            )}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
