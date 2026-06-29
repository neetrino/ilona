'use client';

import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAllUsers, useAdminTeachers, useCreateCustomGroupChat } from '../../hooks';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import {
  CREATE_GROUP_CHAT_DRAG_CLOSE_THRESHOLD_PX,
  CREATE_GROUP_CHAT_DRAG_MAX_OFFSET_PX,
} from './create-group-chat-modal.constants';
import type { CreateGroupChatModalProps } from './create-group-chat-modal.types';

export function useCreateGroupChatModal({ open, onOpenChange, onCreated }: CreateGroupChatModalProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');

  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

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

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1366px)').matches;

  const resetDragRefs = () => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setIsDragging(false);
  };

  const handleDragStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    touchStartYRef.current = firstTouch.clientY;
    touchStartXRef.current = firstTouch.clientX;
    setIsSettling(false);
    setIsDragging(true);
  };

  const handleDragMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    if (!isDragging || touchStartYRef.current === null || touchStartXRef.current === null) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    const deltaY = firstTouch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);
    if (deltaY <= 0 || deltaY <= deltaX) return;
    event.preventDefault();
    setDragOffsetY(Math.min(deltaY * 0.95, CREATE_GROUP_CHAT_DRAG_MAX_OFFSET_PX));
  };

  const handleDragEnd = () => {
    if (!isMobileViewport() || !isDragging) return;
    const shouldClose = dragOffsetY > CREATE_GROUP_CHAT_DRAG_CLOSE_THRESHOLD_PX;
    resetDragRefs();
    if (shouldClose) {
      setDragOffsetY(0);
      requestClose();
      return;
    }
    setIsSettling(true);
    setDragOffsetY(0);
    settleTimerRef.current = setTimeout(() => {
      setIsSettling(false);
      settleTimerRef.current = null;
    }, 280);
  };

  const dragStyle =
    dragOffsetY > 0 || isSettling
      ? {
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }
      : undefined;

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
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
