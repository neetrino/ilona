'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';
import { useStudent, useStudentStatistics } from '../../hooks/useStudents';
import type { StudentDetailsModalProps } from './student-details-modal.types';

export function useStudentDetailsModal(props: StudentDetailsModalProps) {
  const {
    studentId,
    open,
    onClose,
    onEdit,
    onDelete,
    onDeactivate,
    onFeedback,
    actionsDisabled = false,
  } = props;

  const { user } = useAuthStore();
  const basePath = getAdminPortalBasePath(user?.role);
  const t = useTranslations('students');
  const tTeachers = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');

  const {
    data: student,
    isLoading,
    error,
  } = useStudent(studentId || '', !!studentId && open);

  const { data: statistics } = useStudentStatistics(studentId || '', !!studentId && open && !!student);

  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const headerActionsRef = useRef<HTMLDivElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) setPhotoPreviewOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) setActionsMenuOpen(false);
  }, [open]);

  useOutsidePress(headerActionsRef, () => setActionsMenuOpen(false), {
    enabled: actionsMenuOpen,
  });

  useEffect(() => {
    setPhotoPreviewOpen(false);
  }, [studentId]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onClose();
  }, [onClose]);

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
    setDragOffsetY(Math.min(deltaY * 0.95, 340));
  };

  const handleDragEnd = () => {
    if (!isMobileViewport()) return;
    if (!isDragging) return;
    const shouldClose = dragOffsetY > 110;
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

  const fullName = useMemo(() => {
    const first = student?.user?.firstName || '';
    const last = student?.user?.lastName || '';
    return `${first} ${last}`.trim() || '—';
  }, [student?.user?.firstName, student?.user?.lastName]);

  const isUserActive = student?.user?.status === 'ACTIVE';
  const monthlyFee =
    typeof student?.monthlyFee === 'string'
      ? parseFloat(student.monthlyFee)
      : Number(student?.monthlyFee || 0);

  const avatarUrl = student?.user?.avatarUrl;
  const showActions = !!(onEdit || onDelete || onDeactivate || onFeedback);

  const runHeaderAction = (action: () => void) => {
    setActionsMenuOpen(false);
    action();
  };

  const studentActionsMenuItemClass =
    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#3b3b40] transition-colors hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50';

  const canShowActionsMenu = showActions && !!student && !isLoading && !error;

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);
  return {
    basePath,
    t,
    tTeachers,
    tCommon,
    tStatus,
    student,
    isLoading,
    error,
    statistics,
    photoPreviewOpen,
    setPhotoPreviewOpen,
    actionsMenuOpen,
    setActionsMenuOpen,
    headerActionsRef,
    isDialogOpen,
    requestClose,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    dragStyle,
    fullName,
    isUserActive,
    monthlyFee,
    runHeaderAction,
    studentActionsMenuItemClass,
    canShowActionsMenu,
    overlayStyle,
    contentStyle,
    isBaseLayer,
  };
}
