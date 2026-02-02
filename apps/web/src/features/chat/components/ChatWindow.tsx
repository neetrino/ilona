'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMessages, useSocket } from '../hooks';
import { useChatStore } from '../store/chat.store';
import type { Chat, Message } from '../types';
import { cn } from '@/shared/lib/utils';
import { api } from '@/shared/lib/api';

interface ChatWindowProps {
  chat: Chat;
  onSendMessage?: (content: string, type?: string) => void;
  onBack?: () => void;
}

// Vocabulary Modal Component
function VocabularyModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (words: string[]) => void;
  isSubmitting: boolean;
}) {
  const [words, setWords] = useState<string[]>(['', '', '', '', '']);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);
  };

  const handleAddWord = () => {
    setWords([...words, '']);
  };

  const handleRemoveWord = (index: number) => {
    if (words.length > 1) {
      setWords(words.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    const filteredWords = words.filter((w) => w.trim());
    if (filteredWords.length > 0) {
      onSubmit(filteredWords);
      setWords(['', '', '', '', '']);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-purple-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📚</span>
            Send Vocabulary (Բdelays)
          </h3>
          <p className="text-sm text-purple-200 mt-1">
            Add today's vocabulary words for your students
          </p>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          <div className="space-y-2">
            {words.map((word, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-slate-500 w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => handleWordChange(index, e.target.value)}
                  placeholder="Enter word or phrase..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <button
                  onClick={() => handleRemoveWord(index)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  disabled={words.length === 1}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddWord}
            className="mt-3 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add another word
          </button>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || words.every((w) => !w.trim())}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <span>📤</span>
                Send Vocabulary
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatWindow({ chat, onBack }: ChatWindowProps) {
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { getDraft, setDraft, clearDraft, getTypingUsers, addTypingUser } = useChatStore();
  const [inputValue, setInputValue] = useState(getDraft(chat.id));
  const [showVocabularyModal, setShowVocabularyModal] = useState(false);
  const [isSendingVocabulary, setIsSendingVocabulary] = useState(false);

  // Check if user is teacher (can send vocabulary)
  const isTeacher = user?.role === 'TEACHER';
  const isGroupChat = chat.type === 'GROUP';

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
  } = useSocket({
    onTypingStart: ({ chatId, userId }) => {
      if (chatId === chat.id && userId !== user?.id) {
        addTypingUser(chatId, userId);
      }
    },
  });

  // Flatten messages from infinite query
  const messages = messagesData?.pages.flatMap((page) => page.items) || [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark as read when opening chat
  useEffect(() => {
    if (chat.id && isConnected) {
      markAsRead(chat.id);
    }
  }, [chat.id, isConnected, markAsRead]);

  // Save draft on unmount
  useEffect(() => {
    return () => {
      if (inputValue.trim()) {
        setDraft(chat.id, inputValue);
      }
    };
  }, [chat.id, inputValue, setDraft]);

  // Get chat title
  const getChatTitle = () => {
    if (chat.type === 'GROUP') {
      return chat.name || chat.group?.name || 'Group Chat';
    }
    const other = chat.participants.find((p) => p.userId !== user?.id);
    return other ? `${other.user.firstName} ${other.user.lastName}` : 'Chat';
  };

  // Get online status for direct chats
  const getOnlineStatus = () => {
    if (chat.type === 'GROUP') return null;
    const other = chat.participants.find((p) => p.userId !== user?.id);
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
    if (!content || !isConnected) return;

    setInputValue('');
    clearDraft(chat.id);
    stopTyping(chat.id);

    const result = await sendMessage(chat.id, content);
    if (!result.success) {
      console.error('Failed to send message:', result.error);
      setInputValue(content); // Restore on failure
    }
  }, [inputValue, chat.id, isConnected, sendMessage, clearDraft, stopTyping]);

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

  // Format time
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format date separator
  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if should show date separator
  const shouldShowDateSeparator = (message: Message, prevMessage?: Message) => {
    if (!prevMessage) return true;
    const currDate = new Date(message.createdAt).toDateString();
    const prevDate = new Date(prevMessage.createdAt).toDateString();
    return currDate !== prevDate;
  };

  const onlineStatus = getOnlineStatus();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center gap-3">
        {/* Back button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Avatar */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
            chat.type === 'GROUP'
              ? 'bg-gradient-to-br from-purple-500 to-purple-600'
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
          )}
        >
          {getChatTitle()[0]}
        </div>

        {/* Title */}
        <div className="flex-1">
          <h2 className="font-semibold text-slate-800">{getChatTitle()}</h2>
          {typingNames.length > 0 ? (
            <p className="text-xs text-blue-600">
              {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...
            </p>
          ) : onlineStatus !== null ? (
            <p className={cn('text-xs', onlineStatus ? 'text-green-600' : 'text-slate-500')}>
              {onlineStatus ? 'Online' : 'Offline'}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              {chat.participants.length} participants
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )}
            title={isConnected ? 'Connected' : 'Reconnecting...'}
          />
          <button className="p-2 hover:bg-slate-100 rounded-lg">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {/* Load more button */}
        {hasNextPage && (
          <div className="text-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No messages yet</p>
            <p className="text-sm text-slate-400 mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === user?.id;
            const prevMessage = messages[index - 1];
            const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
            const isDeleted = message.content === null && message.isSystem;
            const isVocabulary = message.metadata && typeof message.metadata === 'object' && 'isVocabulary' in message.metadata;

            return (
              <div key={message.id}>
                {/* Date separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-slate-500 shadow-sm">
                      {formatDateSeparator(message.createdAt)}
                    </span>
                  </div>
                )}

                {/* Message */}
                <div
                  className={cn(
                    'flex gap-2',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  {/* Avatar (only for others) */}
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-sm font-medium flex-shrink-0">
                      {message.sender?.firstName?.[0] || '?'}
                    </div>
                  )}

                  <div className={cn('max-w-[70%]', isOwn && 'order-first')}>
                    {/* Sender name (group chats) */}
                    {!isOwn && chat.type === 'GROUP' && (
                      <p className="text-xs text-slate-500 mb-1 ml-1">
                        {message.sender?.firstName} {message.sender?.lastName}
                      </p>
                    )}

                    {/* Message bubble */}
                    <div
                      className={cn(
                        'px-4 py-2 rounded-2xl',
                        isVocabulary
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg border-2 border-purple-300'
                          : isOwn
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-white text-slate-800 rounded-bl-md shadow-sm',
                        isDeleted && 'opacity-60 italic'
                      )}
                    >
                      {isDeleted ? (
                        <p className="text-sm">This message was deleted</p>
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
                      <span className="text-xs text-slate-400">
                        {formatTime(message.createdAt)}
                      </span>
                      {message.isEdited && (
                        <span className="text-xs text-slate-400">(edited)</span>
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
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <button className="p-2 hover:bg-slate-100 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2 bg-slate-100 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-h-32"
            style={{ minHeight: '40px' }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || !isConnected}
            className={cn(
              'p-2 rounded-lg flex-shrink-0 transition-colors',
              inputValue.trim() && isConnected
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-400'
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Vocabulary Modal */}
      <VocabularyModal
        isOpen={showVocabularyModal}
        onClose={() => setShowVocabularyModal(false)}
        onSubmit={handleSendVocabulary}
        isSubmitting={isSendingVocabulary}
      />
    </div>
  );
}
