'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import type { ChatThemeTokens } from '../../lib/chat-theme';
import type { Chat, Message } from '../../types';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatMessageListProps {
  chat: Chat;
  ui: ChatThemeTokens;
  messages: Message[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  currentUserId?: string;
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
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  registerMessageElement: (messageId: string, el: HTMLDivElement | null) => void;
  onFetchNextPage: () => void;
  onMessagesContainerClick: () => void;
  onOpenDeleteMessage: (messageId: string) => void;
  onOwnMessageTap: (messageId: string, event: React.MouseEvent) => void;
}

export function ChatMessageList({
  chat,
  ui,
  messages,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  currentUserId,
  focusedMessageId,
  isMobileViewport,
  mobileDeleteMessageId,
  messageIdToDelete,
  isDeletingMessage,
  senderLabels,
  messagesContainerRef,
  messagesEndRef,
  registerMessageElement,
  onFetchNextPage,
  onMessagesContainerClick,
  onOpenDeleteMessage,
  onOwnMessageTap,
}: ChatMessageListProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');

  return (
    <div
      ref={messagesContainerRef}
      onClick={onMessagesContainerClick}
      className={cn(
        'min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain p-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]',
        ui.messagesBg,
      )}
    >
      {hasNextPage && (
        <div className="text-center">
          <button
            onClick={onFetchNextPage}
            disabled={isFetchingNextPage}
            className={ui.loadMore}
          >
            {isFetchingNextPage ? tCommon('loading') : tChat('loadEarlierMessages')}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className={cn('h-8 w-8 animate-spin rounded-full', ui.spinner)} />
        </div>
      ) : messages.length === 0 ? (
        <div className="py-8 text-center">
          <p className={ui.muted}>{tChat('noMessagesYet')}</p>
          <p className={cn('mt-1 text-sm', ui.subtle)}>{tChat('startConversation')}</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            prevMessage={messages[index - 1]}
            chat={chat}
            ui={ui}
            currentUserId={currentUserId}
            focusedMessageId={focusedMessageId}
            isMobileViewport={isMobileViewport}
            mobileDeleteMessageId={mobileDeleteMessageId}
            messageIdToDelete={messageIdToDelete}
            isDeletingMessage={isDeletingMessage}
            senderLabels={senderLabels}
            registerMessageElement={registerMessageElement}
            onOpenDeleteMessage={onOpenDeleteMessage}
            onOwnMessageTap={onOwnMessageTap}
          />
        ))
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
