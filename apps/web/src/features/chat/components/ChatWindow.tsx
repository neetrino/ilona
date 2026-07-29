'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useLogo } from '@/features/settings/hooks/useSettings';
import {
  useMessages,
  useSocket,
  useAddMessageToCache,
  useCreateDirectChat,
} from '../hooks';
import { useChatStore } from '../store/chat.store';
import type { Chat } from '../types';
import { DeleteConfirmationDialog } from '@/shared/components/ui';
import { api } from '@/shared/lib/api';
import { getFullApiUrl } from '@/shared/lib/api-url-utils';
import { VocabularyModal } from './VocabularyModal';
import { AddMembersModal } from './AddMembersModal';
import { GroupMembersModal } from './GroupMembersModal';
import { getChatThemeForRole, isPortalChatRole } from '../lib/chat-theme';
import { formatChatLastSeen } from '../utils/chat-last-seen';
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
  const { data: logoData } = useLogo();
  const brandLogoUrl = getFullApiUrl(logoData?.logoUrl);
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
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);
  const [isSendingVocabulary, setIsSendingVocabulary] = useState(false);

  const isLgViewport = useIsLgViewport();
  const isMobileViewport = isLgViewport === false;
  const addMessageToCache = useAddMessageToCache();
  const createDirectChat = useCreateDirectChat();
  const { getTypingUsers, addTypingUser, seedPresenceFromChat } = useChatStore();
  const presenceByUserId = useChatStore((state) => state.presenceByUserId);
  const [presenceTick, setPresenceTick] = useState(0);

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
    joinChat,
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

  // New DMs are not in the socket room from the initial connection — join when opened.
  useEffect(() => {
    if (!chat.id || !isConnected) return;
    void joinChat(chat.id);
  }, [chat.id, isConnected, joinChat]);

  useEffect(() => {
    seedPresenceFromChat(chat);
  }, [chat, seedPresenceFromChat]);

  useEffect(() => {
    if (chat.type !== 'DIRECT') return;
    const timer = window.setInterval(() => {
      setPresenceTick((value) => value + 1);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [chat.type, chat.id]);

  // Pages: [newest page, older, …]. Reverse so history renders top→bottom.
  const messages = useMemo(
    () =>
      messagesData?.pages
        ? [...messagesData.pages].reverse().flatMap((page) => page.items)
        : [],
    [messagesData],
  );

  const filteredMessages = useMemo(
    () => messages.filter((message) => !(message.content === null && message.isSystem)),
    [messages],
  );

  const { messagesEndRef, messagesContainerRef } = useChatWindowScroll({
    chatId: chat.id,
    isLoading,
    messagesLength: messages.length,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    onLoadOlder: () => {
      void fetchNextPage();
    },
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
    handleDeletableMessageTap,
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
  const chatAvatarUrl = getChatAvatarUrl(chat, user?.id, brandLogoUrl);
  const chatAvatarInitials = getChatAvatarInitials(chat, user?.id, tChat('groupChat'));
  const typingNames = getTypingNames(chat, getTypingUsers(chat.id));
  const otherUserId = otherParticipant?.userId;
  const otherPresence = otherUserId ? presenceByUserId[otherUserId] : undefined;
  const onlineStatus =
    chat.type === 'GROUP' || !otherUserId
      ? null
      : Boolean(otherPresence?.isOnline || isUserOnline(chat.id, otherUserId));

  const presenceLabel =
    chat.type === 'DIRECT' && otherUserId
      ? formatChatLastSeen(
          Boolean(onlineStatus),
          otherPresence?.lastSeenAt ?? otherParticipant?.user.lastSeenAt,
          (key, values) => (values ? tChat(key, values) : tChat(key)),
        )
      : null;
  void presenceTick;

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
        presenceLabel={presenceLabel}
        isConnected={isConnected}
        isMobileConversation={isMobileConversation}
        isAdminOrManager={isAdminOrManager}
        isGroupChat={isGroupChat}
        isTeacher={isTeacher}
        onBack={onBack}
        onAddMembers={() => setShowAddMembersModal(true)}
        onViewMembers={isGroupChat ? () => setShowGroupMembersModal(true) : undefined}
        onOpenVocabulary={() => setShowVocabularyModal(true)}
        onDeleteGroup={canDeleteGroup ? handleOpenGroupDelete : undefined}
      />

      <ChatMessageList
        chat={chat}
        ui={ui}
        messages={filteredMessages}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        currentUserId={user?.id}
        currentUserAvatar={
          user
            ? {
                avatarUrl: user.avatarUrl,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
              }
            : undefined
        }
        canDeleteAnyMessage={isAdminOrManager}
        isMobileViewport={isMobileViewport}
        mobileDeleteMessageId={mobileDeleteMessageId}
        messageIdToDelete={messageIdToDelete}
        isDeletingMessage={isDeletingMessage}
        senderLabels={senderLabels}
        brandLogoUrl={brandLogoUrl}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        onMessagesContainerClick={handleMessagesContainerClick}
        onOpenDeleteMessage={handleOpenDeleteMessage}
        onDeletableMessageTap={handleDeletableMessageTap}
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

      <GroupMembersModal
        isOpen={showGroupMembersModal}
        onClose={() => setShowGroupMembersModal(false)}
        chat={chat}
        title={chatTitle}
        avatarInitials={chatAvatarInitials}
        currentUserId={user?.id}
        canAddMembers={isAdminOrManager && isGroupChat}
        onAddMembers={() => setShowAddMembersModal(true)}
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
