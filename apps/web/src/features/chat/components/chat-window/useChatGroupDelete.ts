'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteGroup } from '@/features/groups';
import { getErrorMessage } from '@/shared/lib/api';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useDeleteCustomGroupChat, chatKeys } from '../../hooks';
import { groupKeys } from '@/features/groups/hooks/useGroups';
import { CHAT_DELETE_GROUP_PARAM } from '../../lib/chat-url-params';
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
  const { readParam, setParams, removeParams } = useAppSearchUrl();
  const deleteGroup = useDeleteGroup();
  const deleteCustomGroupChat = useDeleteCustomGroupChat();

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteTargetFromUrl = readParam(CHAT_DELETE_GROUP_PARAM);
  const isDialogOpen = isEnabled && deleteTargetFromUrl === chat.id;

  const isClassGroup = Boolean(chat.groupId);
  const groupName = chat.group?.name ?? chat.name ?? tChat('groupDefault');
  const isPending = deleteGroup.isPending || deleteCustomGroupChat.isPending;

  useEffect(() => {
    if (deleteTargetFromUrl && deleteTargetFromUrl !== chat.id) {
      removeParams([CHAT_DELETE_GROUP_PARAM], { mode: 'replace' });
    }
  }, [chat.id, deleteTargetFromUrl, removeParams]);

  const closeDeleteDialog = useCallback(() => {
    removeParams([CHAT_DELETE_GROUP_PARAM], { mode: 'replace' });
  }, [removeParams]);

  const handleOpenDelete = useCallback(() => {
    if (!isEnabled) return;
    setDeleteError(null);
    setParams({ [CHAT_DELETE_GROUP_PARAM]: chat.id }, { mode: 'push' });
  }, [chat.id, isEnabled, setParams]);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isPending) return;
      if (!open) {
        closeDeleteDialog();
        setDeleteError(null);
      }
    },
    [closeDeleteDialog, isPending],
  );

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
      closeDeleteDialog();
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
    closeDeleteDialog,
    deleteCustomGroupChat,
    deleteGroup,
    invalidateAfterDelete,
    isClassGroup,
    onDeleted,
    tChat,
    tGroups,
  ]);

  const dialogTitle = isClassGroup ? tGroups('deleteGroupTitle') : tChat('deleteGroupChatTitle');
  const dialogSubtitle = tChat('deleteGroupDialogSubtitle');
  const dialogWarning = isClassGroup
    ? tChat('deleteGroupDialogWarningClass')
    : tChat('deleteGroupDialogWarningCustom');

  return {
    canDeleteGroup: isEnabled,
    isGroupDeleteDialogOpen: isDialogOpen,
    isDeletingGroup: isPending,
    groupDeleteError: deleteError,
    groupDeleteDialogTitle: dialogTitle,
    groupDeleteDialogSubtitle: dialogSubtitle,
    groupDeleteDialogWarning: dialogWarning,
    groupDeleteName: groupName,
    isClassGroupDelete: isClassGroup,
    handleOpenGroupDelete: handleOpenDelete,
    handleGroupDeleteDialogOpenChange: handleDialogOpenChange,
    handleConfirmGroupDelete: handleConfirmDelete,
  };
}
