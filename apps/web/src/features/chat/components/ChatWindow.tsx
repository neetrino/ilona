'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMessages, useSocket } from '../hooks';
import { useChatStore } from '../store/chat.store';
import type { Chat, Message } from '../types';
import { cn } from '@/shared/lib/utils';
import { api, getProxiedFileUrl } from '@/shared/lib/api';

interface ChatWindowProps {
  chat: Chat;
  onSendMessage?: (content: string, type?: string) => void;
  onBack?: () => void;
}

// Voice Message Player Component with error handling
function VoiceMessagePlayer({
  fileUrl,
  duration,
  fileName,
}: {
  fileUrl: string;
  duration?: number;
  fileName?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Convert R2 URLs to API proxy URLs to avoid CORS issues
  const proxiedUrl = getProxiedFileUrl(fileUrl) || fileUrl;

  // Format duration for voice messages (seconds to MM:SS)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget;
    const error = audio.error;
    
    if (error) {
      let errorMessage = 'Unknown error';
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = 'Playback aborted';
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error - file may not be accessible';
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage = 'Decode error - file format may not be supported';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'File format not supported';
          break;
      }
      
      console.warn('[ChatWindow] Voice playback error:', {
        code: error.code,
        message: errorMessage,
        fileUrl: proxiedUrl.substring(0, 100), // Log first 100 chars only
      });
    }
    
    setHasError(true);
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  // Try to reload on error (with retry limit)
  const handleRetry = () => {
    if (audioRef.current) {
      setHasError(false);
      setIsLoading(true);
      audioRef.current.load();
    }
  };

  if (hasError) {
    return (
      <div className="flex items-center gap-3 min-w-[200px] p-2 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex-shrink-0 text-red-500">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-xs text-red-700 font-medium">Unable to play audio</p>
          <p className="text-xs text-red-600">File may be missing or inaccessible</p>
        </div>
        <button
          onClick={handleRetry}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          title="Retry loading audio"
        >
          Retry
        </button>
        {duration && (
          <span className="text-xs text-red-600 flex-shrink-0">
            {formatDuration(duration)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <div className="flex-shrink-0">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </div>
      <div className="flex-1 relative">
        <audio
          ref={audioRef}
          src={proxiedUrl}
          controls
          preload="metadata"
          className="flex-1 h-10 w-full"
          style={{ minWidth: '200px' }}
          onError={handleError}
          onCanPlay={handleCanPlay}
          onLoadStart={handleLoadStart}
          crossOrigin="anonymous"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {duration && (
        <span className="text-xs opacity-80 flex-shrink-0">
          {formatDuration(duration)}
        </span>
      )}
    </div>
  );
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
            Send Vocabulary (Բառեր)
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track last marked conversation to prevent duplicate mark-as-read calls
  const lastMarkedConversationIdRef = useRef<string | null>(null);

  const { getDraft, setDraft, clearDraft, getTypingUsers, addTypingUser } = useChatStore();
  // Initialize input as empty - drafts will be loaded in useEffect when chat changes
  const [inputValue, setInputValue] = useState('');
  const [showVocabularyModal, setShowVocabularyModal] = useState(false);
  const [isSendingVocabulary, setIsSendingVocabulary] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

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
  const messages = messagesData?.pages.flatMap((page) => page.items) || [];

  // Scroll to bottom on new messages, but only if user is near bottom
  // This prevents interrupting user when they're reading old messages
  useEffect(() => {
    if (!messagesEndRef.current || !messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    
    // Only scroll if user is near bottom (within 200px) or if it's the first load
    if (isNearBottom || messages.length === 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

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
  // This is critical: input must NEVER be populated from incoming messages or lastMessage
  useEffect(() => {
    // Always reset input when switching chats
    // Only load draft if user has previously typed something (user's own draft)
    // NEVER use chat.lastMessage or any message content
    const draft = getDraft(chat.id);
    // Only set draft if it exists and is not empty (user's own typed content)
    // This ensures incoming messages never appear in the input
    setInputValue(draft || '');
  }, [chat.id, getDraft]);

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
    return other ? `${other.user.firstName} ${other.user.lastName}` : 'Chat';
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
    return `${other.user.firstName[0] || ''}${other.user.lastName[0] || ''}` || '?';
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

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    setDeletingMessageId(messageId);
    try {
      const result = await deleteMessage(messageId);
      if (!result.success) {
        console.error('Failed to delete message:', result.error);
        alert('Failed to delete message. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message. Please try again.');
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Format time
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format duration for voice messages (seconds to MM:SS)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onlineStatus = getOnlineStatus();

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
        <div className="relative">
          {getChatAvatarUrl() ? (
            <img
              src={getChatAvatarUrl()!}
              alt={getChatTitle()}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
                chat.type === 'GROUP'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                  : 'bg-primary'
              )}
            >
              {getChatAvatarInitials()}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex-1">
          <h2 className="font-semibold text-slate-800">{getChatTitle()}</h2>
          {typingNames.length > 0 ? (
            <p className="text-xs text-primary">
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
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {/* Load more button */}
        {hasNextPage && (
          <div className="text-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm text-primary hover:text-primary/90"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No messages yet</p>
            <p className="text-sm text-slate-400 mt-1">Start the conversation!</p>
          </div>
        ) : (
          (() => {
            // Filter out deleted messages (soft deleted from old system)
            // With hard delete, messages are completely removed, but we filter old soft-deleted ones
            const filteredMessages = messages.filter(
              (message) => !(message.content === null && message.isSystem)
            );

            return filteredMessages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const prevMessage = filteredMessages[index - 1];
              const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
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
                    'flex gap-2 group',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  {/* Avatar (only for others) */}
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {message.sender?.avatarUrl ? (
                        <img
                          src={message.sender.avatarUrl}
                          alt={`${message.sender.firstName} ${message.sender.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-600 text-sm font-medium">
                          {message.sender?.firstName?.[0] || '?'}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={cn('max-w-[70%] relative', isOwn && 'order-first')}>
                    {/* Delete button (only for own messages) */}
                    {isOwn && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        disabled={deletingMessageId === message.id}
                        className={cn(
                          'absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50',
                          isOwn ? '-right-1' : '-left-1'
                        )}
                        title="Delete message"
                      >
                        {deletingMessageId === message.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    )}
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
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-white text-slate-800 rounded-bl-md shadow-sm'
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
          });
          })()
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
            className="flex-1 px-4 py-2 bg-slate-100 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 max-h-32"
            style={{ minHeight: '40px' }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              'p-2 rounded-lg flex-shrink-0 transition-colors',
              inputValue.trim()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
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
