import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface UseChatMessageDeleteOptions {
  chatId: string;
  isMobileViewport: boolean;
  deleteMessage: (messageId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useChatMessageDelete({
  chatId,
  isMobileViewport,
  deleteMessage,
}: UseChatMessageDeleteOptions) {
  const tChat = useTranslations('chat');
  const [messageIdToDelete, setMessageIdToDelete] = useState<string | null>(null);
  const [deleteMessageError, setDeleteMessageError] = useState<string | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [mobileDeleteMessageId, setMobileDeleteMessageId] = useState<string | null>(null);

  useEffect(() => {
    setMobileDeleteMessageId(null);
  }, [chatId]);

  const handleOpenDeleteMessage = (messageId: string) => {
    setDeleteMessageError(null);
    setMessageIdToDelete(messageId);
  };

  const handleMessagesContainerClick = () => {
    if (isMobileViewport) {
      setMobileDeleteMessageId(null);
    }
  };

  const handleDeletableMessageTap = (messageId: string, event: React.MouseEvent) => {
    if (!isMobileViewport) return;

    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea')) return;

    event.stopPropagation();
    setMobileDeleteMessageId((prev) => (prev === messageId ? null : messageId));
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
      setMobileDeleteMessageId(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      setDeleteMessageError(tChat('deleteMessageFailed'));
    } finally {
      setIsDeletingMessage(false);
    }
  };

  return {
    messageIdToDelete,
    deleteMessageError,
    isDeletingMessage,
    mobileDeleteMessageId,
    handleOpenDeleteMessage,
    handleMessagesContainerClick,
    handleDeletableMessageTap,
    handleDeleteMessageDialogOpenChange,
    handleConfirmDeleteMessage,
  };
}
