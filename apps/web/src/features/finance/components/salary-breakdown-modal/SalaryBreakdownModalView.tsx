'use client';

import { Trash2 } from 'lucide-react';
import {
  Button,
  DataTable,
  DeleteConfirmationDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';
import { ObligationDetailsModal } from '../ObligationDetailsModal';
import { SalaryBreakdownTotalsRow } from './SalaryBreakdownTotalsRow';
import type { useSalaryBreakdownModal } from './useSalaryBreakdownModal';

type SalaryBreakdownModalViewProps = ReturnType<typeof useSalaryBreakdownModal>;

export function SalaryBreakdownModalView({
  t,
  tCommon,
  teacherName,
  month,
  open,
  onClose,
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
}: SalaryBreakdownModalViewProps) {
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  Salary Breakdown: {teacherName}{month ? ` - ${formatMonth(month)}` : ''}
                </DialogTitle>
                <DialogDescription>
                  Detailed lesson-by-lesson breakdown of salary calculations for this month
                </DialogDescription>
              </div>
              {selectedLessonIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleDeleteClick}
                  disabled={excludeLessons.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                  {allSelected
                    ? t('deleteAll', { count: selectedLessonIds.size })
                    : t('deleteSelected', { count: selectedLessonIds.size })}
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                Failed to load salary breakdown. Please try again.
              </div>
            ) : sortedLessons.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No lessons found for this period.
              </div>
            ) : (
              <>
                <DataTable
                  columns={breakdownColumns}
                  data={sortedLessons}
                  keyExtractor={(lesson) => lesson.lessonId}
                  isLoading={false}
                  emptyMessage="No lessons found"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SalaryBreakdownTotalsRow {...totals} />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={handleDeleteConfirm}
        title={t('excludeLessonsTitle')}
        description={`${t('excludeLessonsLead', { count: selectedLessonIds.size })} ${t('excludeLessonsDetail')}`}
        isLoading={excludeLessons.isPending}
        error={deleteError}
        confirmLabel={t('excludeLessonsConfirm')}
        cancelLabel={tCommon('cancel')}
        loadingLabel={t('excluding')}
      />

      <ObligationDetailsModal
        lessonId={selectedLessonIdForObligation}
        open={isObligationModalOpen}
        onClose={closeObligationModal}
      />
    </>
  );
}
