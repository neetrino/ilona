import { useState } from 'react';
import { useDeleteLessonsBulk, useCompleteLesson } from '@/features/lessons';
import { getErrorMessage } from '@/shared/lib/api';

export function useLessonActions(refetch: () => void) {
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [completingLessonId, setCompletingLessonId] = useState<string | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completeSuccess, setCompleteSuccess] = useState(false);

  const deleteLessonsBulk = useDeleteLessonsBulk();
  const completeLesson = useCompleteLesson();

  // Handle bulk delete click
  const handleBulkDeleteClick = (lessonIds: string[]) => {
    setSelectedLessonIds(lessonIds);
    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);
    setIsBulkDeleteDialogOpen(true);
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirm = async () => {
    if (selectedLessonIds.length === 0) return;

    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);

    const count = selectedLessonIds.length;
    try {
      await deleteLessonsBulk.mutateAsync(selectedLessonIds);
      setDeletedCount(count);
      setBulkDeleteSuccess(true);
      setIsBulkDeleteDialogOpen(false);
      setSelectedLessonIds([]);
      
      // Clear success message after a delay
      setTimeout(() => {
        setBulkDeleteSuccess(false);
        setDeletedCount(0);
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete lessons. Please try again.');
      setBulkDeleteError(message);
    }
  };

  // Handle complete lesson click
  const handleCompleteClick = (lessonId: string) => {
    setCompletingLessonId(lessonId);
    setCompleteError(null);
    setCompleteSuccess(false);
    setIsCompleteDialogOpen(true);
  };

  // Handle complete lesson confirmation
  const handleCompleteConfirm = async () => {
    if (!completingLessonId) return;

    setCompleteError(null);
    setCompleteSuccess(false);

    try {
      await completeLesson.mutateAsync({ id: completingLessonId, data: undefined });
      // Force immediate refetch to update UI with lock states
      await refetch();
      setCompleteSuccess(true);
      setIsCompleteDialogOpen(false);
      setCompletingLessonId(null);
      
      // Clear success message after a delay
      setTimeout(() => {
        setCompleteSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to complete lesson. Please try again.');
      setCompleteError(message);
    }
  };

  // Handle bulk delete dialog close
  const handleBulkDeleteDialogClose = (open: boolean) => {
    setIsBulkDeleteDialogOpen(open);
    if (!open) {
      setBulkDeleteError(null);
      setBulkDeleteSuccess(false);
      setSelectedLessonIds([]);
    }
  };

  // Handle complete dialog close
  const handleCompleteDialogClose = (open: boolean) => {
    setIsCompleteDialogOpen(open);
    if (!open) {
      setCompletingLessonId(null);
      setCompleteError(null);
      setCompleteSuccess(false);
    }
  };

  return {
    // Bulk delete
    selectedLessonIds,
    isBulkDeleteDialogOpen,
    handleBulkDeleteDialogClose,
    bulkDeleteError,
    bulkDeleteSuccess,
    deletedCount,
    handleBulkDeleteClick,
    handleBulkDeleteConfirm,
    isBulkDeleteLoading: deleteLessonsBulk.isPending,
    // Complete lesson
    completingLessonId,
    isCompleteDialogOpen,
    handleCompleteDialogClose,
    completeError,
    completeSuccess,
    handleCompleteClick,
    handleCompleteConfirm,
    isCompleteLoading: completeLesson.isPending,
  };
}

