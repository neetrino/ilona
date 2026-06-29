'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useSalaryBreakdown, useExcludeLessonsFromSalary, financeKeys } from '../../hooks/useFinance';
import { buildSalaryBreakdownColumns } from './SalaryBreakdownTableColumns';
import {
  computeLessonTotals,
  formatDate,
  formatMonth,
  initialsFromLabel,
  sortLessons,
} from './salary-breakdown-modal.util';
import type { SalaryBreakdownModalProps } from './salary-breakdown-modal.types';

export function useSalaryBreakdownModal({
  teacherId,
  teacherName,
  month,
  open,
  onClose,
}: SalaryBreakdownModalProps) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const { data: breakdown, isLoading, error, refetch } = useSalaryBreakdown(
    teacherId,
    month,
    open && !!teacherId,
  );
  const excludeLessons = useExcludeLessonsFromSalary();

  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('lessonDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedLessonIdForObligation, setSelectedLessonIdForObligation] = useState<string | null>(null);
  const [isObligationModalOpen, setIsObligationModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSelectedLessonIds(new Set());
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const sortedLessons = useMemo(
    () => (breakdown?.lessons ? sortLessons(breakdown.lessons, sortBy, sortOrder) : []),
    [breakdown?.lessons, sortBy, sortOrder],
  );

  const allSelected = sortedLessons.length > 0 && selectedLessonIds.size === sortedLessons.length;
  const someSelected = selectedLessonIds.size > 0 && selectedLessonIds.size < sortedLessons.length;
  const teacherInitials = initialsFromLabel(teacherName);
  const totals = useMemo(() => computeLessonTotals(sortedLessons), [sortedLessons]);

  const handleSort = useCallback((key: string) => {
    setSortBy((prevSortBy) => {
      if (prevSortBy === key) {
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
        return prevSortBy;
      }
      setSortOrder('asc');
      return key;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedLessonIds((prev) => {
      if (sortedLessons.length > 0 && prev.size === sortedLessons.length) {
        return new Set();
      }
      return new Set(sortedLessons.map((lesson) => lesson.lessonId));
    });
  }, [sortedLessons]);

  const handleSelectOne = useCallback((lessonId: string, checked: boolean) => {
    setSelectedLessonIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(lessonId);
      } else {
        next.delete(lessonId);
      }
      return next;
    });
  }, []);

  const handleDeleteClick = useCallback(() => {
    if (selectedLessonIds.size === 0) return;
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  }, [selectedLessonIds.size]);

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedLessonIds.size === 0) return;

    setDeleteError(null);

    try {
      await excludeLessons.mutateAsync(Array.from(selectedLessonIds));
      setSelectedLessonIds(new Set());
      setIsDeleteDialogOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to exclude lessons from salary. Please try again.';
      setDeleteError(errorMessage);
    }
  }, [selectedLessonIds, excludeLessons, refetch, queryClient]);

  const handleObligationClick = useCallback((lessonId: string) => {
    setSelectedLessonIdForObligation(lessonId);
    setIsObligationModalOpen(true);
  }, []);

  const closeObligationModal = useCallback(() => {
    setIsObligationModalOpen(false);
    setSelectedLessonIdForObligation(null);
  }, []);

  const handleDeleteDialogOpenChange = useCallback((nextOpen: boolean) => {
    setIsDeleteDialogOpen(nextOpen);
    if (!nextOpen) setDeleteError(null);
  }, []);

  const breakdownColumns = useMemo(
    () =>
      buildSalaryBreakdownColumns({
        t,
        teacherName,
        teacherInitials,
        isLoading,
        allSelected,
        someSelected,
        selectedLessonIds,
        formatDate,
        onSelectAll: handleSelectAll,
        onSelectOne: handleSelectOne,
        onObligationClick: handleObligationClick,
      }),
    [
      t,
      teacherName,
      teacherInitials,
      isLoading,
      allSelected,
      someSelected,
      selectedLessonIds,
      handleSelectAll,
      handleSelectOne,
      handleObligationClick,
    ],
  );

  return {
    t,
    tCommon,
    teacherName,
    month,
    open,
    onClose,
    shouldRender: open && !!teacherId,
    formatMonth,
    isLoading,
    error,
    sortedLessons,
    breakdownColumns,
    totals,
    selectedLessonIds,
    allSelected,
    sortBy,
    sortOrder,
    handleSort,
    handleDeleteClick,
    isDeleteDialogOpen,
    handleDeleteDialogOpenChange,
    handleDeleteConfirm,
    deleteError,
    excludeLessons,
    selectedLessonIdForObligation,
    isObligationModalOpen,
    closeObligationModal,
  };
}
