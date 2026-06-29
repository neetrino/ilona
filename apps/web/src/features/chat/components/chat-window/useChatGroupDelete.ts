'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteGroup } from '@/features/groups';
import { getErrorMessage } from '@/shared/lib/api';
import { useDeleteCustomGroupChat, chatKeys } from '../../hooks';
import { groupKeys } from '@/features/groups/hooks/useGroups';
import type { Chat } from '../../types';

interface UseChatGroupDeleteOptions {
  chat: Chat;
  isEnabled: boolean;
  onDeleted?: () => void;
}

export function useChatGroupDelete({ chat, isEnabled, onDeleted }: UseChatGroupDeleteOptions) {
  const tChat = useTranslations('chat');
  const tGroups = useTranslations('groups');
  const queryClient = useQueryClient();
  const deleteGroup = useDeleteGroup();
  const deleteCustomGroupChat = useDeleteCustomGroupChat();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isClassGroup = Boolean(chat.groupId);
  const groupName = chat.group?.name ?? chat.name ?? tChat('groupDefault');
  const isPending = deleteGroup.isPending || deleteCustomGroupChat.isPending;

  const handleOpenDelete = useCallback(() => {
    if (!isEnabled) return;
    setDeleteError(null);
    setIsDialogOpen(true);
  }, [isEnabled]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open && isPending) return;
    setIsDialogOpen(open);
    if (!open) setDeleteError(null);
  }, [isPending]);

  const invalidateAfterDelete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    queryClient.invalidateQueries({ queryKey: chatKeys.customGroupChats() });
    queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'admin'] });
    queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    queryClient.invalidateQueries({ queryKey: chatKeys.teacherGroups() });
  }, [queryClient]);

  const handleConfirmDelete = useCallback(async () => {
    setDeleteError(null);
    try {
      if (isClassGroup && chat.groupId) {
        await deleteGroup.mutateAsync(chat.groupId);
      } else {
        await deleteCustomGroupChat.mutateAsync(chat.id);
      }
      invalidateAfterDelete();
      setIsDialogOpen(false);
      onDeleted?.();
    } catch (err: unknown) {
      const fallback = isClassGroup
        ? tGroups('failedDeleteGroup')
        : tChat('deleteGroupChatFailed');
      setDeleteError(getErrorMessage(err, fallback));
    }
  }, [
    chat.groupId,
    chat.id,
    deleteCustomGroupChat,
    deleteGroup,
    invalidateAfterDelete,
    isClassGroup,
    onDeleted,
    tChat,
    tGroups,
  ]);

  const dialogTitle = isClassGroup ? tGroups('deleteGroupTitle') : tChat('deleteGroupChatTitle');
  const dialogDescription = isClassGroup
    ? tGroups('deleteGroupWithName', { name: groupName })
    : tChat('deleteGroupChatWithName', { name: groupName });

  return {
    canDeleteGroup: isEnabled,
    isGroupDeleteDialogOpen: isDialogOpen,
    isDeletingGroup: isPending,
    groupDeleteError: deleteError,
    groupDeleteDialogTitle: dialogTitle,
    groupDeleteDialogDescription: dialogDescription,
    handleOpenGroupDelete: handleOpenDelete,
    handleGroupDeleteDialogOpenChange: handleDialogOpenChange,
    handleConfirmGroupDelete: handleConfirmDelete,
  };
}
