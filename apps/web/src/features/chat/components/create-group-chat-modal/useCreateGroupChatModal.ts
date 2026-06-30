'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAllUsers, useAdminTeachers, useCreateCustomGroupChat } from '../../hooks';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import type { CreateGroupChatModalProps } from './create-group-chat-modal.types';

export function useCreateGroupChatModal({ open, onOpenChange, onCreated }: CreateGroupChatModalProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');

  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(open);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName('');
      setSearch('');
      setDebouncedSearch('');
      setSelectedIds(new Set());
    }
  }, [open]);

  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const { data: users = [], isLoading } = useAdminAllUsers(open ? debouncedSearch || undefined : undefined);
  const { data: teachers = [] } = useAdminTeachers(open ? undefined : undefined);
  const createChat = useCreateCustomGroupChat();

  const selectableUsers = useMemo(
    () => (currentUserId ? users.filter((u) => u.id !== currentUserId) : users),
    [users, currentUserId],
  );

  const teacherIds = useMemo(
    () => teachers.filter((t) => t.id !== currentUserId).map((t) => t.id),
    [teachers, currentUserId],
  );

  const allTeachersSelected =
    teacherIds.length > 0 && teacherIds.every((id) => selectedIds.has(id));

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: isDialogOpen,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!isDialogOpen) {
      resetDrag();
    }
  }, [isDialogOpen, resetDrag]);

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllTeachers = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = teacherIds.length > 0 && teacherIds.every((id) => prev.has(id));
      if (allSelected) teacherIds.forEach((id) => next.delete(id));
      else teacherIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    try {
      const chat = await createChat.mutateAsync({
        name: trimmedName,
        participantIds: [...selectedIds],
      });
      onCreated(chat);
      requestClose();
    } catch {
      // Error shown via mutation state
    }
  };

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);

  return {
    tChat,
    tCommon,
    name,
    setName,
    search,
    setSearch,
    debouncedSearch,
    selectedIds,
    isDialogOpen,
    dragStyle,
    dragHandleProps,
    scrollContentProps,
    overlayStyle,
    contentStyle,
    isBaseLayer,
    selectableUsers,
    isLoading,
    teacherIds,
    allTeachersSelected,
    createChatPending: createChat.isPending,
    createChatError: createChat.error,
    toggleUser,
    toggleAllTeachers,
    handleSubmit,
    requestClose,
  };
}
