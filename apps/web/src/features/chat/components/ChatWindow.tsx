'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  useMessages,
  useSocket,
  useAddMessageToCache,
  useCreateDirectChat,
  useChatMessageNavigation,
} from '../hooks';
import { useChatStore } from '../store/chat.store';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';
import { DeleteConfirmationDialog } from '@/shared/components/ui';
import { api } from '@/shared/lib/api';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { VoiceRecorder } from './VoiceRecorder';
import { VocabularyModal } from './VocabularyModal';
import { AddMembersModal } from './AddMembersModal';
import { MessageNavigationControls } from './MessageNavigationControls';
import { sendMessageHttp } from '../api/chat.api';
import {
  formatTime,
  formatDateSeparator,
  shouldShowDateSeparator,
  getMessageSenderDisplay,
  formatDisplayName,
  getInitialsFromParts,
} from '../utils/chat-utils';
import Image from 'next/image';
import { getChatTheme } from '../lib/chat-theme';

interface ChatWindowProps {
  chat: Chat;
  onSendMessage?: (content: string, type?: string) => void;
  onBack?: () => void;
  onChatUpdated?: (chat: Chat) => void;
}

export function ChatWindow({ chat, onBack, onChatUpdated }: ChatWindowProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();
  const senderLabels = useMemo(
    () => ({
      formerManager: tChat('formerManager'),
      inactiveManager: tChat('inactiveManager'),
      unknownUser: tChat('unknownUser'),
    }),
    [tChat],
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track last marked conversation to prevent duplicate mark-as-read calls
  const lastMarkedConversationIdRef = useRef<string | null>(null);
  // Track which chat we've done initial scroll-to-bottom for (so we only do it once per open)
  const lastInitialScrollChatIdRef = useRef<string | null>(null);
  // Track previous message count to detect new messages vs initial load
  const prevMessagesLengthRef = useRef<number>(0);

  const { getDraft, setDraft, clearDraft, getTypingUsers, addTypingUser } = useChatStore();
  // Initialize input as empty - drafts will be loaded in useEffect when chat changes
  const [inputValue, setInputValue] = useState('');
  const [showVocabularyModal, setShowVocabularyModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [isSendingVocabulary, setIsSendingVocabulary] = useState(false);
  const [messageIdToDelete, setMessageIdToDelete] = useState<string | null>(null);
  const [deleteMessageError, setDeleteMessageError] = useState<string | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showVoiceToTeacherRecorder, setShowVoiceToTeacherRecorder] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isUploadingVoiceToTeacher, setIsUploadingVoiceToTeacher] = useState(false);

  const addMessageToCache = useAddMessageToCache();
  const createDirectChat = useCreateDirectChat();

  // Check if user is teacher (can send vocabulary)
  const isTeacher = user?.role === 'TEACHER';
  const isGroupChat = chat.type === 'GROUP';
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isStudent = user?.role === 'STUDENT';
  const ui = getChatTheme(isStudent ? 'student' : 'default');

  // Resolve teacher user id for "Send Voice to Teacher" (Student only): ONLY in direct 1:1 chat with assigned teacher
  const getOtherParticipantForVoice = () => {
    if (chat.type !== 'DIRECT') return null;
    return chat.participants.find((p) => p.userId !== user?.id);
  };
  const otherParticipant = getOtherParticipantForVoice();
  const teacherUserIdForVoice: string | null =
    isStudent && chat.type === 'DIRECT' && otherParticipant?.user.role === 'TEACHER'
      ? otherParticipant.userId
      : null;
  const canSendVoiceToTeacher = Boolean(teacherUserIdForVoice);

  // Fetch messages
  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(chat.id);

  // Socket
  const {
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    isUserOnline,
    deleteMessage,
  } = useSocket({
    onTypingStart: ({ chatId, userId }) => {
      if (chatId === chat.id && userId !== user?.id) {
        addTypingUser(chatId, userId);
      }
    },
    onNewMessage: (message) => {
      // When a new message arrives while chat is open, mark as read immediately
      // This ensures messages are marked as seen even if user doesn't reply
      if (message.chatId === chat.id && message.senderId !== user?.id) {
        // Only mark as read if message is from another user
        markAsRead(chat.id).catch((error) => {
          console.error('[ChatWindow] Failed to mark new message as read:', error);
        });
      }
    },
  });

  // Flatten messages from infinite query
  const messages = useMemo(
    () => messagesData?.pages.flatMap((page) => page.items) ?? [],
    [messagesData],
  );

  const filteredMessages = useMemo(
    () =>
      messages.filter(
        (message) => !(message.content === null && message.isSystem)
      ),
    [messages]
  );

  const navigableMessageIds = useMemo(
    () => filteredMessages.map((m) => m.id),
    [filteredMessages]
  );

  const {
    focusedMessageId,
    registerMessageElement,
    goToPrevious,
    goToNext,
    canGoPrevious,
    canGoNext,
  } = useChatMessageNavigation({
    navigableMessageIds,
    chatId: chat.id,
    endAnchorRef: messagesEndRef,
  });

  // Reset scroll state when switching chats so the new chat gets initial scroll when its messages load
  useEffect(() => {
    lastInitialScrollChatIdRef.current = null;
    prevMessagesLengthRef.current = 0;
  }, [chat.id]);

  // Initial open: scroll to bottom after messages are loaded and rendered (once per chat)
  useLayoutEffect(() => {
    if (isLoading || messages.length === 0) return;
    if (lastInitialScrollChatIdRef.current === chat.id) return;
    if (!messagesEndRef.current || !messagesContainerRef.current) return;

    lastInitialScrollChatIdRef.current = chat.id;
    prevMessagesLengthRef.current = messages.length;

    const scrollToBottom = () => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };

    // Run after layout is complete so scrollHeight is correct (flex/overflow can settle next frame)
    const rafId = requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom); // second frame for flex layouts
    });
    return () => cancelAnimationFrame(rafId);
  }, [chat.id, isLoading, messages.length]);

  // New messages: only auto-scroll if user is already near bottom (do not interrupt when reading older messages)
  useEffect(() => {
    if (!messagesEndRef.current || !messagesContainerRef.current || messages.length === 0) return;
    // Only react when message count increased (new message arrived), not on initial load
    if (messages.length <= prevMessagesLengthRef.current) return;
    prevMessagesLengthRef.current = messages.length;

    const container = messagesContainerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 200;

    if (isNearBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, chat.id]);

  // Mark as read when opening chat (with guards to prevent infinite loops)
  // Mark as read when chat is opened, regardless of unreadCount or whether user replies
  // This ensures messages are marked as seen when user views the chat
  // Use ref for markAsRead to avoid dependency issues
  const markAsReadRef = useRef(markAsRead);
  markAsReadRef.current = markAsRead;

  useEffect(() => {
    // Mark as read if:
    // 1. chat.id exists
    // 2. conversationId changed (not the same conversation)
    // 3. Messages query has finished loading (either loaded messages or confirmed empty)
    // 4. We haven't already marked this conversation as read
    // Note: markAsRead will use HTTP fallback if socket is not connected
    if (
      chat.id &&
      chat.id !== lastMarkedConversationIdRef.current &&
      !isLoading // Wait for messages to finish loading (even if empty)
    ) {
      lastMarkedConversationIdRef.current = chat.id;
      markAsReadRef.current(chat.id).catch((error) => {
        console.error('[ChatWindow] Failed to mark as read:', error);
        // Don't reset ref on error - only reset if chat actually changes
        // This prevents infinite retry loops
      });
    }
  }, [chat.id, isLoading]);

  // Reset input value when chat changes - only load user's own draft, never from messages
  useEffect(() => {
    const draft = getDraft(chat.id);
    setInputValue(draft || '');
  }, [chat.id, getDraft]);

  // Auto-resize textarea by content so typed text stays visible (scrollHeight-based)
  const MIN_TEXTAREA_HEIGHT = 40;
  const MAX_TEXTAREA_HEIGHT = 200;

  useLayoutEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.overflowY = 'hidden';
    ta.style.height = '0';
    const contentHeight = ta.scrollHeight;
    const h = Math.max(MIN_TEXTAREA_HEIGHT, Math.min(contentHeight, MAX_TEXTAREA_HEIGHT));
    ta.style.height = `${h}px`;
    ta.style.overflowY = h >= MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, [inputValue]);

  const handleOpenDeleteMessage = (messageId: string) => {
    setDeleteMessageError(null);
    setMessageIdToDelete(messageId);
  };

  const handleDeleteMessageDialogOpenChange = (open: boolean) => {
    if (!open && !isDeletingMessage) {
      setMessageIdToDelete(null);
      setDeleteMessageError(null);
    }
  };

  const handleConfirmDeleteMessage = async () => {
    if (!messageIdToDelete || isDeletingMessage) return;

    const messageId = messageIdToDelete;
    setDeleteMessageError(null);
    setIsDeletingMessage(true);
    try {
      const result = await deleteMessage(messageId);
      if (!result.success) {
        console.error('Failed to delete message:', result.error);
        setDeleteMessageError(tChat('deleteMessageFailed'));
        return;
      }
      setMessageIdToDelete(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      setDeleteMessageError(tChat('deleteMessageFailed'));
    } finally {
      setIsDeletingMessage(false);
    }
  };

  // Voice message: upload file then send message via HTTP; update cache and close recorder
  const handleVoiceRecorded = useCallback(
    async (file: File, durationSec: number, _mimeType: string) => {
      setIsUploadingVoice(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await api.post<{
          success: boolean;
          data: { url: string; fileName: string; fileSize: number };
        }>('/storage/chat', formData);

        if (!uploadResponse.success || !uploadResponse.data) {
          throw new Error('Failed to upload voice message');
        }

        const { url: fileUrl, fileName, fileSize } = uploadResponse.data;

        const message = await sendMessageHttp(chat.id, '', 'VOICE', {
          fileUrl,
          fileName,
          fileSize,
          duration: durationSec,
        });

        addMessageToCache(chat.id, message);
        setShowVoiceRecorder(false);
      } catch (error) {
        console.error('Failed to send voice message:', error);
        const msg = error instanceof Error ? error.message : 'Failed to send voice message. Please try again.';
        alert(msg);
      } finally {
        setIsUploadingVoice(false);
      }
    },
    [chat.id, addMessageToCache]
  );

  // When switching chats, exit voice recorder and discard any recording
  useEffect(() => {
    setShowVoiceRecorder(false);
    setShowVoiceToTeacherRecorder(false);
  }, [chat.id]);

  // Voice-to-teacher: upload, ensure DM with teacher exists, send with metadata, add to cache
  const handleVoiceToTeacherRecorded = useCallback(
    async (file: File, durationSec: number, _mimeType: string) => {
      if (!teacherUserIdForVoice) return;
      setIsUploadingVoiceToTeacher(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await api.post<{
          success: boolean;
          data: { url: string; fileName: string; fileSize: number };
        }>('/storage/chat', formData);

        if (!uploadResponse.success || !uploadResponse.data) {
          throw new Error('Failed to upload voice message');
        }

        const { url: fileUrl, fileName, fileSize } = uploadResponse.data;

        let targetChatId: string;
        if (chat.type === 'DIRECT' && otherParticipant?.userId === teacherUserIdForVoice) {
          targetChatId = chat.id;
        } else {
          const dmChat = await createDirectChat.mutateAsync(teacherUserIdForVoice);
          targetChatId = dmChat.id;
        }

        const message = await sendMessageHttp(targetChatId, '', 'VOICE', {
          fileUrl,
          fileName,
          fileSize,
          duration: durationSec,
          metadata: { voiceToTeacher: true, teacherId: teacherUserIdForVoice },
        });

        addMessageToCache(targetChatId, message);
        setShowVoiceToTeacherRecorder(false);
      } catch (error) {
        console.error('Failed to send voice to teacher:', error);
        const msg =
          error instanceof Error ? error.message : 'Failed to send voice to teacher. Please try again.';
        alert(msg);
      } finally {
        setIsUploadingVoiceToTeacher(false);
      }
    },
    [teacherUserIdForVoice, chat.type, chat.id, otherParticipant?.userId, createDirectChat, addMessageToCache]
  );

  // Save draft on unmount - only save if user has typed something
  // This ensures we never accidentally save incoming messages as drafts
  useEffect(() => {
    return () => {
      // Only save draft if input has content (user's typed text)
      // This is safe because inputValue is only set by user typing or from a previous draft
      // It is NEVER set from incoming messages or chat.lastMessage
      if (inputValue.trim()) {
        setDraft(chat.id, inputValue);
      } else {
        // Clear draft if input is empty
        clearDraft(chat.id);
      }
    };
  }, [chat.id, inputValue, setDraft, clearDraft]);

  // Get other participant for direct chats
  const getOtherParticipant = () => {
    if (chat.type === 'GROUP') return null;
    return chat.participants.find((p) => p.userId !== user?.id);
  };

  // Get chat title
  const getChatTitle = () => {
    if (chat.type === 'GROUP') {
      return chat.name || chat.group?.name || 'Group Chat';
    }
    const other = getOtherParticipant();
    return other
      ? formatDisplayName(other.user.firstName, other.user.lastName) || 'Chat'
      : 'Chat';
  };

  // Get avatar URL for chat header
  const getChatAvatarUrl = () => {
    if (chat.type === 'GROUP') return null;
    const other = getOtherParticipant();
    return other?.user.avatarUrl || null;
  };

  // Get avatar initials for fallback
  const getChatAvatarInitials = () => {
    if (chat.type === 'GROUP') {
      const name = chat.name || chat.group?.name || 'Group Chat';
      return name[0] || 'G';
    }
    const other = getOtherParticipant();
    if (!other) return '?';
    return getInitialsFromParts(other.user.firstName, other.user.lastName);
  };

  // Get online status for direct chats
  const getOnlineStatus = () => {
    if (chat.type === 'GROUP') return null;
    const other = getOtherParticipant();
    if (!other) return null;
    return isUserOnline(chat.id, other.userId);
  };

  // Get typing users names
  const typingUserIds = getTypingUsers(chat.id);
  const typingNames = typingUserIds
    .map((id) => {
      const participant = chat.participants.find((p) => p.userId === id);
      return participant?.user.firstName;
    })
    .filter(Boolean);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Typing indicator
    if (isConnected) {
      startTyping(chat.id);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(chat.id);
      }, 2000);
    }
  };

  // Handle send
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content) return; // Allow sending even if socket is not connected (will use HTTP fallback)

    setInputValue('');
    clearDraft(chat.id);
    stopTyping(chat.id);

    const result = await sendMessage(chat.id, content);
    if (!result.success) {
      console.error('Failed to send message:', result.error);
      setInputValue(content); // Restore on failure
    }
  }, [inputValue, chat.id, sendMessage, clearDraft, stopTyping]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle vocabulary send
  const handleSendVocabulary = async (words: string[]) => {
    setIsSendingVocabulary(true);
    try {
      await api.post(`/chat/${chat.id}/vocabulary`, { words });
      setShowVocabularyModal(false);
    } catch (error) {
      console.error('Failed to send vocabulary:', error);
    } finally {
      setIsSendingVocabulary(false);
    }
  };

  const onlineStatus = getOnlineStatus();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn('flex items-center gap-3 border-b p-4', ui.border, ui.headerBg)}>
        {/* Back button (mobile) */}
        {onBack && (
          <button onClick={onBack} className={cn('lg:hidden -ml-2 p-2', ui.iconBtn)}>
            <svg className={cn('h-5 w-5', ui.body)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Avatar */}
        <div className="relative">
          {getChatAvatarUrl() ? (
            <Image
              src={getChatAvatarUrl() ?? ''}
              alt={getChatTitle()}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
                chat.type === 'GROUP'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                  : ui.avatar,
              )}
            >
              {getChatAvatarInitials()}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex-1">
          <h2 className={cn('font-semibold', ui.title)}>{getChatTitle()}</h2>
          {typingNames.length > 0 ? (
            <p className={cn('text-xs', ui.typing)}>
              {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...
            </p>
          ) : onlineStatus !== null ? (
            <p className={cn('text-xs', onlineStatus ? 'text-green-600' : ui.muted)}>
              {onlineStatus ? 'Online' : 'Offline'}
            </p>
          ) : (
            <p className={cn('text-xs', ui.muted)}>
              {chat.participants.length} participants
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Add members (Admin only, group chat only) */}
          {isAdminOrManager && isGroupChat && (
            <button
              onClick={() => setShowAddMembersModal(true)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                ui.ghostBtn,
              )}
              title="Add members"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3z" />
              </svg>
              <span className="hidden sm:inline">Add members</span>
            </button>
          )}
          {/* Vocabulary Button (Teachers only, Group chats only) */}
          {isTeacher && isGroupChat && (
            <button
              onClick={() => setShowVocabularyModal(true)}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-1.5"
              title="Send Vocabulary (Բdelays)"
            >
              <span>📚</span>
              <span className="hidden sm:inline">Vocabulary</span>
            </button>
          )}
          {!isLoading && filteredMessages.length >= 2 && (
            <MessageNavigationControls
              variant={isStudent ? 'student' : 'default'}
              onPrevious={goToPrevious}
              onNext={goToNext}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
            />
          )}
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )}
            title={isConnected ? 'Connected' : 'Reconnecting...'}
          />
          <button className={cn('p-2', ui.iconBtn)}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className={cn('flex-1 space-y-4 overflow-y-auto p-4', ui.messagesBg)}
      >
        {/* Load more button */}
        {hasNextPage && (
          <div className="text-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className={ui.loadMore}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className={cn('h-8 w-8 animate-spin rounded-full', ui.spinner)} />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-8">
            <p className={ui.muted}>No messages yet</p>
            <p className={cn('mt-1 text-sm', ui.subtle)}>Start the conversation!</p>
          </div>
        ) : (
            filteredMessages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const senderDisplay = getMessageSenderDisplay(message, senderLabels);
              const prevMessage = filteredMessages[index - 1];
              const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
              const isVocabulary = message.metadata && typeof message.metadata === 'object' && 'isVocabulary' in message.metadata;
              const voiceSubstituteMeta =
                message.type === 'VOICE' &&
                message.metadata &&
                typeof message.metadata === 'object' &&
                'sentAsSubstitute' in message.metadata &&
                message.metadata.sentAsSubstitute === true;
              const substituteVoiceLabel =
                voiceSubstituteMeta &&
                typeof message.metadata === 'object' &&
                message.metadata !== null &&
                'substituteLabel' in message.metadata &&
                typeof (message.metadata as { substituteLabel?: unknown }).substituteLabel === 'string'
                  ? (message.metadata as { substituteLabel: string }).substituteLabel
                  : voiceSubstituteMeta
                    ? 'Substitute teacher'
                    : null;

            return (
              <div
                key={message.id}
                ref={(el) => registerMessageElement(message.id, el)}
                className={cn(
                  'rounded-lg scroll-mt-8',
                  focusedMessageId === message.id && ui.focusMessage
                )}
              >
                {/* Date separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <span className={cn('rounded-full px-3 py-1 text-xs', ui.datePill)}>
                      {formatDateSeparator(message.createdAt)}
                    </span>
                  </div>
                )}

                {/* Message */}
                <div
                  className={cn(
                    'flex gap-2 group',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  {/* Avatar (only for others) */}
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {message.sender?.avatarUrl ? (
                        <Image
                          src={message.sender.avatarUrl}
                          alt={senderDisplay.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
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
                            ? getInitialsFromParts(
                                message.sender.firstName,
                                message.sender.lastName,
                              )
                            : '?'}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={cn('max-w-[70%] relative', isOwn && 'order-first')}>
                    {/* Delete button (only for own messages) */}
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteMessage(message.id)}
                        disabled={isDeletingMessage && messageIdToDelete === message.id}
                        className={cn(
                          'absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50',
                          isOwn ? '-right-1' : '-left-1'
                        )}
                        title="Delete message"
                        aria-label="Delete message"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {/* Sender name (group chats) */}
                    {!isOwn && chat.type === 'GROUP' && (
                      <p className={cn('mb-1 ml-1 text-xs', ui.muted)}>
                        <span className={senderDisplay.isInactive ? 'italic opacity-80' : ''}>
                          {senderDisplay.name}
                        </span>
                        {substituteVoiceLabel ? (
                          <span className="ml-2 text-amber-700 font-medium">· {substituteVoiceLabel}</span>
                        ) : null}
                      </p>
                    )}

                    {isOwn && chat.type === 'GROUP' && substituteVoiceLabel && (
                      <p className="text-xs text-amber-700 font-medium mb-1 mr-1 text-right">{substituteVoiceLabel}</p>
                    )}

                    {/* Message bubble */}
                    <div
                      className={cn(
                        'px-4 py-2 rounded-2xl',
                        isVocabulary
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg border-2 border-purple-300'
                          : isOwn
                            ? ui.ownBubble
                            : ui.otherBubble
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
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-400/30">
                            <span className="text-lg">📚</span>
                            <span className="font-semibold">Vocabulary (Բառdelays)</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                    </div>

                    {/* Time & edited indicator */}
                    <div
                      className={cn(
                        'flex items-center gap-1 mt-1',
                        isOwn ? 'justify-end mr-1' : 'justify-start ml-1'
                      )}
                    >
                      <span className={cn('text-xs', ui.subtle)}>
                        {formatTime(message.createdAt)}
                      </span>
                      {message.isEdited && (
                        <span className={cn('text-xs', ui.subtle)}>(edited)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={cn('border-t p-4', ui.border, ui.headerBg)}>
        {showVoiceRecorder ? (
          <div className="space-y-2">
            <VoiceRecorder
              variant={isStudent ? 'student' : 'default'}
              onRecorded={handleVoiceRecorded}
              onCancel={() => setShowVoiceRecorder(false)}
              conversationId={chat.id}
            />
            {isUploadingVoice && (
              <p className={cn('text-center text-sm', ui.muted)}>Uploading voice message...</p>
            )}
          </div>
        ) : showVoiceToTeacherRecorder ? (
          <div className="space-y-2">
            <p className={cn('text-sm font-medium', ui.body)}>Recording for your teacher</p>
            <VoiceRecorder
              variant={isStudent ? 'student' : 'default'}
              onRecorded={handleVoiceToTeacherRecorded}
              onCancel={() => setShowVoiceToTeacherRecorder(false)}
              conversationId={chat.id}
            />
            {isUploadingVoiceToTeacher && (
              <p className={cn('text-center text-sm', ui.muted)}>Sending voice to teacher...</p>
            )}
          </div>
        ) : (
          <div className="flex items-end gap-2">
            {/* Text input */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className={ui.input}
              style={{ minHeight: '40px' }}
            />

            {/* Microphone: start voice recording (all roles) */}
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              className={cn('flex-shrink-0 rounded-lg p-2 transition-colors', ui.ghostBtn)}
              title="Record voice message"
              aria-label="Record voice message"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>

            {/* Send Voice to Teacher (Student only, in direct 1:1 chat with assigned teacher) */}
            {isStudent && canSendVoiceToTeacher && (
              <button
                type="button"
                onClick={() => setShowVoiceToTeacherRecorder(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg flex-shrink-0 bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors border border-amber-200"
                title="Send voice message to your teacher (saved in Recordings)"
                aria-label="Send voice to teacher"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                <span className="text-xs font-medium hidden sm:inline">To teacher</span>
              </button>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={cn(
                'flex-shrink-0 rounded-lg p-2 transition-colors',
                inputValue.trim() ? ui.primaryBtn : ui.primaryBtnDisabled,
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Vocabulary Modal */}
      <VocabularyModal
        isOpen={showVocabularyModal}
        onClose={() => setShowVocabularyModal(false)}
        onSubmit={handleSendVocabulary}
        isSubmitting={isSendingVocabulary}
      />

      {/* Add Members Modal (Admin + group chat) */}
      <AddMembersModal
        isOpen={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        chat={chat}
        onMemberAdded={onChatUpdated}
      />

      <DeleteConfirmationDialog
        open={messageIdToDelete !== null}
        onOpenChange={handleDeleteMessageDialogOpenChange}
        onConfirm={handleConfirmDeleteMessage}
        title={tChat('deleteMessageTitle')}
        description={tChat('deleteMessageDescription')}
        isLoading={isDeletingMessage}
        error={deleteMessageError}
        confirmLabel={tCommon('delete')}
        cancelLabel={tCommon('cancel')}
        loadingLabel={tChat('deleting')}
      />
    </div>
  );
}
