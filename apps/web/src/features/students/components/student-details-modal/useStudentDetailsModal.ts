'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
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

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onClose();
  }, [onClose]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: isDialogOpen,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!isDialogOpen) {
      resetDrag();
    }
  }, [isDialogOpen, resetDrag]);

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
    dragHandleProps,
    scrollContentProps,
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
    avatarUrl,
  };
}
