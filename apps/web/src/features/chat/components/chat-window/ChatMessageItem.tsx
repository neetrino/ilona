'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import type { ChatThemeTokens } from '../../lib/chat-theme';
import type { Chat, Message } from '../../types';
import {
  formatTime,
  formatDateSeparator,
  shouldShowDateSeparator,
  getMessageSenderDisplay,
  getInitialsFromParts,
} from '../../utils/chat-utils';
import { isPendingMessageId } from '../../hooks';
import { VoiceMessagePlayer } from '../VoiceMessagePlayer';
import { getSubstituteVoiceLabel, isVocabularyMessage } from './chat-message-meta';

interface ChatMessageItemProps {
  message: Message;
  prevMessage?: Message;
  chat: Chat;
  ui: ChatThemeTokens;
  currentUserId?: string;
  canDeleteAnyMessage: boolean;
  focusedMessageId: string | null;
  isMobileViewport: boolean;
  mobileDeleteMessageId: string | null;
  messageIdToDelete: string | null;
  isDeletingMessage: boolean;
  senderLabels: {
    formerManager: string;
    inactiveManager: string;
    unknownUser: string;
  };
  registerMessageElement: (messageId: string, el: HTMLDivElement | null) => void;
  onOpenDeleteMessage: (messageId: string) => void;
  onDeletableMessageTap: (messageId: string, event: React.MouseEvent) => void;
}

export function ChatMessageItem({
  message,
  prevMessage,
  chat,
  ui,
  currentUserId,
  canDeleteAnyMessage,
  focusedMessageId,
  isMobileViewport,
  mobileDeleteMessageId,
  messageIdToDelete,
  isDeletingMessage,
  senderLabels,
  registerMessageElement,
  onOpenDeleteMessage,
  onDeletableMessageTap,
}: ChatMessageItemProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const isOwn = message.senderId === currentUserId;
  const isPending = isPendingMessageId(message.id);
  const canDelete = !isPending && (isOwn || canDeleteAnyMessage);
  const senderDisplay = getMessageSenderDisplay(message, senderLabels);
  const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
  const isVocabulary = isVocabularyMessage(message);
  const substituteVoiceLabel = getSubstituteVoiceLabel(message, tChat('substituteTeacherDefault'));

  return (
    <div
      ref={(el) => registerMessageElement(message.id, el)}
      className={cn('scroll-mt-8 rounded-lg', focusedMessageId === message.id && ui.focusMessage)}
    >
      {showDateSeparator && (
        <div className="my-4 flex items-center justify-center">
          <span className={cn('rounded-full px-3 py-1 text-xs', ui.datePill)}>
            {formatDateSeparator(message.createdAt, locale, {
              today: tCommon('today'),
              yesterday: tChat('yesterday'),
            })}
          </span>
        </div>
      )}

      <div className={cn('group flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
        {!isOwn && (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
            {message.sender?.avatarUrl ? (
              <Image
                src={message.sender.avatarUrl}
                alt={senderDisplay.name}
                width={32}
                height={32}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center text-sm font-medium',
                  ui.skeleton,
                  ui.body,
                )}
              >
                {message.sender
                  ? getInitialsFromParts(message.sender.firstName, message.sender.lastName)
                  : '?'}
              </div>
            )}
          </div>
        )}

        <div
          className={cn('relative max-w-[70%]', isOwn && 'order-first')}
          data-message-actions={canDelete ? '' : undefined}
          onClick={canDelete ? (event) => onDeletableMessageTap(message.id, event) : undefined}
        >
          {canDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenDeleteMessage(message.id);
              }}
              disabled={isDeletingMessage && messageIdToDelete === message.id}
              className={cn(
                'absolute -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-opacity hover:bg-red-600 disabled:opacity-50',
                isMobileViewport
                  ? mobileDeleteMessageId === message.id
                    ? 'opacity-100'
                    : 'opacity-0'
                  : 'opacity-0 group-hover:opacity-100',
                isOwn ? '-right-1' : '-left-1',
              )}
              title={tChat('deleteMessage')}
              aria-label={tChat('deleteMessage')}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {!isOwn && chat.type === 'GROUP' && (
            <p className={cn('mb-1 ml-1 text-xs', ui.muted)}>
              <span className={senderDisplay.isInactive ? 'italic opacity-80' : ''}>
                {senderDisplay.name}
              </span>
              {substituteVoiceLabel ? (
                <span className="ml-2 font-medium text-amber-700">· {substituteVoiceLabel}</span>
              ) : null}
            </p>
          )}

          {isOwn && chat.type === 'GROUP' && substituteVoiceLabel && (
            <p className="mb-1 mr-1 text-right text-xs font-medium text-amber-700">
              {substituteVoiceLabel}
            </p>
          )}

          <div
            className={cn(
              'rounded-2xl px-4 py-2',
              isPending && 'opacity-70',
              isVocabulary
                ? 'rounded-lg border-2 border-purple-300 bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                : isOwn
                  ? ui.ownBubble
                  : ui.otherBubble,
            )}
          >
            {message.type === 'VOICE' && message.fileUrl ? (
              <VoiceMessagePlayer
                fileUrl={message.fileUrl}
                duration={message.duration}
                fileName={message.fileName}
              />
            ) : isVocabulary ? (
              <div>
                <div className="mb-2 flex items-center gap-2 border-b border-purple-400/30 pb-2">
                  <span className="text-lg">📚</span>
                  <span className="font-semibold">{tChat('vocabularyWords')}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
            )}
          </div>

          <div
            className={cn(
              'mt-1 flex items-center gap-1',
              isOwn ? 'mr-1 justify-end' : 'ml-1 justify-start',
            )}
          >
            <span className={cn('text-xs', ui.subtle)}>{formatTime(message.createdAt, locale)}</span>
            {message.isEdited && (
              <span className={cn('text-xs', ui.subtle)}>{tChat('edited')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
