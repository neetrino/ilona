import { useState, useCallback, startTransition } from 'react';
import { useDeleteLesson, useDeleteLessonsBulk, type Lesson } from '@/features/lessons';
import { getErrorMessage } from '@/shared/lib/api';

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

export function useDailyDutiesDeleteActions(lessons: Lesson[], t: TranslateFn) {
  const deleteLesson = useDeleteLesson();
  const deleteLessonsBulk = useDeleteLessonsBulk();

  const [pendingBulkDeleteIds, setPendingBulkDeleteIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  const [pendingSingleDeleteId, setPendingSingleDeleteId] = useState<string | null>(null);
  const [isSingleDeleteDialogOpen, setIsSingleDeleteDialogOpen] = useState(false);
  const [singleDeleteError, setSingleDeleteError] = useState<string | null>(null);

  const [deleteNotice, setDeleteNotice] = useState<{ variant: 'success' | 'error'; text: string } | null>(
    null,
  );

  const showDeleteNotice = useCallback((variant: 'success' | 'error', text: string) => {
    setDeleteNotice({ variant, text });
    window.setTimeout(() => {
      startTransition(() => setDeleteNotice(null));
    }, 4000);
  }, []);

  const handleBulkDeleteClick = useCallback((lessonIds: string[]) => {
    const unique = [...new Set(lessonIds)];
    if (unique.length === 0) return;
    setBulkDeleteError(null);
    setPendingBulkDeleteIds(unique);
    setIsBulkDeleteDialogOpen(true);
  }, []);

  const handleBulkDeleteDialogOpenChange = useCallback((open: boolean) => {
    setIsBulkDeleteDialogOpen(open);
    if (!open) {
      setBulkDeleteError(null);
      setPendingBulkDeleteIds([]);
    }
  }, []);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (pendingBulkDeleteIds.length === 0 || deleteLessonsBulk.isPending) return;
    setBulkDeleteError(null);
    try {
      await deleteLessonsBulk.mutateAsync(pendingBulkDeleteIds);
      const n = pendingBulkDeleteIds.length;
      setIsBulkDeleteDialogOpen(false);
      setPendingBulkDeleteIds([]);
      showDeleteNotice(
        'success',
        n === 1 ? t('lessonDeletedSuccess') : t('lessonsDeletedSuccess', { count: n }),
      );
    } catch (err: unknown) {
      setBulkDeleteError(getErrorMessage(err, t('failedDeleteLessons')));
    }
  }, [deleteLessonsBulk, pendingBulkDeleteIds, showDeleteNotice, t]);

  const handleSingleDeleteClick = useCallback((lessonId: string) => {
    setSingleDeleteError(null);
    setPendingSingleDeleteId(lessonId);
    setIsSingleDeleteDialogOpen(true);
  }, []);

  const handleSingleDeleteDialogOpenChange = useCallback((open: boolean) => {
    setIsSingleDeleteDialogOpen(open);
    if (!open) {
      setSingleDeleteError(null);
      setPendingSingleDeleteId(null);
    }
  }, []);

  const handleSingleDeleteConfirm = useCallback(async () => {
    if (!pendingSingleDeleteId || deleteLesson.isPending) return;
    setSingleDeleteError(null);
    try {
      await deleteLesson.mutateAsync(pendingSingleDeleteId);
      setIsSingleDeleteDialogOpen(false);
      setPendingSingleDeleteId(null);
      showDeleteNotice('success', t('lessonDeletedSuccess'));
    } catch (err: unknown) {
      setSingleDeleteError(getErrorMessage(err, t('failedDeleteLesson')));
    }
  }, [deleteLesson, pendingSingleDeleteId, showDeleteNotice, t]);

  const singleDeleteLesson = pendingSingleDeleteId
    ? lessons.find((l) => l.id === pendingSingleDeleteId)
    : undefined;

  return {
    deleteNotice,
    bulkDelete: {
      open: isBulkDeleteDialogOpen,
      lessonCount: pendingBulkDeleteIds.length,
      error: bulkDeleteError,
      isLoading: deleteLessonsBulk.isPending,
      onOpenChange: handleBulkDeleteDialogOpenChange,
      onConfirm: handleBulkDeleteConfirm,
      onClick: handleBulkDeleteClick,
    },
    singleDelete: {
      open: isSingleDeleteDialogOpen,
      error: singleDeleteError,
      isLoading: deleteLesson.isPending,
      lessonCount: 1,
      lesson: singleDeleteLesson,
      onOpenChange: handleSingleDeleteDialogOpenChange,
      onConfirm: handleSingleDeleteConfirm,
      onClick: handleSingleDeleteClick,
    },
  };
}
