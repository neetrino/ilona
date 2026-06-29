'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
import { DeleteConfirmationDialog } from '@/shared/components/ui';
import { api } from '@/shared/lib/api';
import { VocabularyModal } from './VocabularyModal';
import { AddMembersModal } from './AddMembersModal';
import { getChatThemeForRole, isPortalChatRole } from '../lib/chat-theme';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';
import { ChatWindowHeader } from './chat-window/ChatWindowHeader';
import { ChatMessageList } from './chat-window/ChatMessageList';
import { ChatComposer } from './chat-window/ChatComposer';
import {
  getChatAvatarInitials,
  getChatAvatarUrl,
  getChatTitle,
  getOtherParticipant,
  getTypingNames,
} from './chat-window/chat-window-display';
import { useChatWindowScroll } from './chat-window/useChatWindowScroll';
import { useChatWindowComposer } from './chat-window/useChatWindowComposer';
import { useChatVoiceHandlers } from './chat-window/useChatVoiceHandlers';
import { useChatMessageDelete } from './chat-window/useChatMessageDelete';
import { useChatGroupDelete } from './chat-window/useChatGroupDelete';
import { ChatGroupDeleteDialog } from './chat-window/ChatGroupDeleteDialog';

interface ChatWindowProps {
  chat: Chat;
  onSendMessage?: (content: string, type?: string) => void;
  onBack?: () => void;
  onChatUpdated?: (chat: Chat) => void;
}

export function ChatWindow({ chat, onBack, onChatUpdated }: ChatWindowProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { user } = useAuthStore();
  const senderLabels = useMemo(
    () => ({
      formerManager: tChat('formerManager'),
      inactiveManager: tChat('inactiveManager'),
      unknownUser: tChat('unknownUser'),
    }),
    [tChat],
  );

  const lastMarkedConversationIdRef = useRef<string | null>(null);
  const [showVocabularyModal, setShowVocabularyModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [isSendingVocabulary, setIsSendingVocabulary] = useState(false);

  const isLgViewport = useIsLgViewport();
  const isMobileViewport = isLgViewport === false;
  const addMessageToCache = useAddMessageToCache();
  const createDirectChat = useCreateDirectChat();
  const { getTypingUsers, addTypingUser } = useChatStore();

  const isTeacher = user?.role === 'TEACHER';
  const isGroupChat = chat.type === 'GROUP';
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isStudent = user?.role === 'STUDENT';
  const ui = getChatThemeForRole(user?.role);
  const mobilePlaceholderKey =
    Boolean(onBack) && isMobileViewport && locale === 'hy' ? 'typeMessageMobile' : 'typeMessage';
  const useMobileComposerSizing = Boolean(onBack) && isMobileViewport;
  const mobileComposerBtnClass = useMobileComposerSizing
    ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.875rem] p-0'
    : 'flex-shrink-0 rounded-lg p-2';
  const mobileComposerInputClass = useMobileComposerSizing
    ? 'h-10 min-h-10 max-h-10 resize-none overflow-hidden py-0 leading-10'
    : '';

  const otherParticipant = getOtherParticipant(chat, user?.id);
  const teacherUserIdForVoice: string | null =
    isStudent && chat.type === 'DIRECT' && otherParticipant?.user.role === 'TEACHER'
      ? otherParticipant.userId
      : null;
  const canSendVoiceToTeacher = Boolean(teacherUserIdForVoice);

  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(chat.id);

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
      if (message.chatId === chat.id && message.senderId !== user?.id) {
        markAsRead(chat.id).catch((error) => {
          console.error('[ChatWindow] Failed to mark new message as read:', error);
        });
      }
    },
  });

  const messages = useMemo(
    () => messagesData?.pages.flatMap((page) => page.items) ?? [],
    [messagesData],
  );

  const filteredMessages = useMemo(
    () => messages.filter((message) => !(message.content === null && message.isSystem)),
    [messages],
  );

  const { messagesEndRef, messagesContainerRef } = useChatWindowScroll(
    chat.id,
    isLoading,
    messages.length,
  );

  const {
    focusedMessageId,
    registerMessageElement,
    goToPrevious,
    goToNext,
    canGoPrevious,
    canGoNext,
  } = useChatMessageNavigation({
    navigableMessageIds: filteredMessages.map((m) => m.id),
    chatId: chat.id,
    endAnchorRef: messagesEndRef,
  });

  const markAsReadRef = useRef(markAsRead);
  markAsReadRef.current = markAsRead;

  useEffect(() => {
    if (!chat.id || chat.id === lastMarkedConversationIdRef.current) return;
    lastMarkedConversationIdRef.current = chat.id;
    markAsReadRef.current(chat.id).catch((error) => {
      console.error('[ChatWindow] Failed to mark as read:', error);
    });
  }, [chat.id]);

  const {
    inputRef,
    inputValue,
    handleInputChange,
    handleSend,
    handleKeyDown,
  } = useChatWindowComposer({
    chatId: chat.id,
    isConnected,
    useMobileComposerSizing,
    startTyping,
    stopTyping,
    sendMessage,
  });

  const {
    showVoiceRecorder,
    setShowVoiceRecorder,
    showVoiceToTeacherRecorder,
    setShowVoiceToTeacherRecorder,
    isUploadingVoice,
    isUploadingVoiceToTeacher,
    handleVoiceRecorded,
    handleVoiceToTeacherRecorded,
  } = useChatVoiceHandlers({
    chat,
    teacherUserIdForVoice,
    otherParticipantUserId: otherParticipant?.userId,
    addMessageToCache,
    createDirectChat,
  });

  const {
    messageIdToDelete,
    deleteMessageError,
    isDeletingMessage,
    mobileDeleteMessageId,
    handleOpenDeleteMessage,
    handleMessagesContainerClick,
    handleOwnMessageTap,
    handleDeleteMessageDialogOpenChange,
    handleConfirmDeleteMessage,
  } = useChatMessageDelete({
    chatId: chat.id,
    isMobileViewport,
    deleteMessage,
  });

  const {
    canDeleteGroup,
    isGroupDeleteDialogOpen,
    isDeletingGroup,
    groupDeleteError,
    groupDeleteDialogTitle,
    groupDeleteDialogSubtitle,
    groupDeleteDialogWarning,
    groupDeleteName,
    handleOpenGroupDelete,
    handleGroupDeleteDialogOpenChange,
    handleConfirmGroupDelete,
  } = useChatGroupDelete({
    chat,
    isEnabled: isAdminOrManager && isGroupChat,
    onDeleted: onBack,
  });

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

  const chatTitle = getChatTitle(chat, user?.id, tChat('chatTitle'));
  const chatAvatarUrl = getChatAvatarUrl(chat, user?.id);
  const chatAvatarInitials = getChatAvatarInitials(chat, user?.id, tChat('groupChat'));
  const typingNames = getTypingNames(chat, getTypingUsers(chat.id));
  const onlineStatus =
    chat.type === 'GROUP' || !otherParticipant
      ? null
      : isUserOnline(chat.id, otherParticipant.userId);

  const isMobileConversation = Boolean(onBack);
  const isAdminPortalChat = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const needsMobileBottomNavComposerOffset =
    isMobileConversation && (isAdminPortalChat || isPortalChatRole(user?.role));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ChatWindowHeader
        chat={chat}
        ui={ui}
        title={chatTitle}
        avatarUrl={chatAvatarUrl}
        avatarInitials={chatAvatarInitials}
        typingNames={typingNames}
        onlineStatus={onlineStatus}
        isConnected={isConnected}
        isMobileConversation={isMobileConversation}
        isAdminOrManager={isAdminOrManager}
        isGroupChat={isGroupChat}
        isTeacher={isTeacher}
        showMessageNavigation={!isLoading && filteredMessages.length >= 2}
        navigationVariant={isPortalChatRole(user?.role) ? 'student' : 'default'}
        onBack={onBack}
        onAddMembers={() => setShowAddMembersModal(true)}
        onOpenVocabulary={() => setShowVocabularyModal(true)}
        onDeleteGroup={canDeleteGroup ? handleOpenGroupDelete : undefined}
        onPrevious={goToPrevious}
        onNext={goToNext}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />

      <ChatMessageList
        chat={chat}
        ui={ui}
        messages={filteredMessages}
        isLoading={isLoading}
        hasNextPage={Boolean(hasNextPage)}
        isFetchingNextPage={isFetchingNextPage}
        currentUserId={user?.id}
        focusedMessageId={focusedMessageId}
        isMobileViewport={isMobileViewport}
        mobileDeleteMessageId={mobileDeleteMessageId}
        messageIdToDelete={messageIdToDelete}
        isDeletingMessage={isDeletingMessage}
        senderLabels={senderLabels}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        registerMessageElement={registerMessageElement}
        onFetchNextPage={() => fetchNextPage()}
        onMessagesContainerClick={handleMessagesContainerClick}
        onOpenDeleteMessage={handleOpenDeleteMessage}
        onOwnMessageTap={handleOwnMessageTap}
      />

      <ChatComposer
        chatId={chat.id}
        ui={ui}
        userRole={user?.role}
        inputRef={inputRef}
        inputValue={inputValue}
        placeholderKey={mobilePlaceholderKey}
        isMobileConversation={isMobileConversation}
        needsMobileBottomNavComposerOffset={needsMobileBottomNavComposerOffset}
        useMobileComposerSizing={useMobileComposerSizing}
        mobileComposerBtnClass={mobileComposerBtnClass}
        mobileComposerInputClass={mobileComposerInputClass}
        isStudent={isStudent}
        canSendVoiceToTeacher={canSendVoiceToTeacher}
        showVoiceRecorder={showVoiceRecorder}
        showVoiceToTeacherRecorder={showVoiceToTeacherRecorder}
        isUploadingVoice={isUploadingVoice}
        isUploadingVoiceToTeacher={isUploadingVoiceToTeacher}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSend={handleSend}
        onStartVoiceRecorder={() => setShowVoiceRecorder(true)}
        onCancelVoiceRecorder={() => setShowVoiceRecorder(false)}
        onVoiceRecorded={handleVoiceRecorded}
        onStartVoiceToTeacherRecorder={() => setShowVoiceToTeacherRecorder(true)}
        onCancelVoiceToTeacherRecorder={() => setShowVoiceToTeacherRecorder(false)}
        onVoiceToTeacherRecorded={handleVoiceToTeacherRecorded}
      />

      <VocabularyModal
        isOpen={showVocabularyModal}
        onClose={() => setShowVocabularyModal(false)}
        onSubmit={handleSendVocabulary}
        isSubmitting={isSendingVocabulary}
      />

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

      <ChatGroupDeleteDialog
        open={isGroupDeleteDialogOpen}
        onOpenChange={handleGroupDeleteDialogOpenChange}
        onConfirm={handleConfirmGroupDelete}
        title={groupDeleteDialogTitle}
        subtitle={groupDeleteDialogSubtitle}
        groupName={groupDeleteName}
        warningText={groupDeleteDialogWarning}
        isLoading={isDeletingGroup}
        error={groupDeleteError}
        cancelLabel={tCommon('cancel')}
        confirmLabel={tCommon('delete')}
        loadingLabel={tChat('deleting')}
      />
    </div>
  );
}
