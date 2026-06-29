import { AddLessonForm } from '@/features/lessons';
import { BulkDeleteConfirmationDialog } from '@/features/lessons/components/BulkDeleteConfirmationDialog';
import { SubstituteLessonModal } from '@/app/[locale]/(admin)/admin/daily-duties/components/SubstituteLessonModal';
import { AdminLessonDetailSheet } from '@/app/[locale]/(admin)/admin/daily-duties/components/AdminLessonDetailSheet';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import type { Lesson } from '@/features/lessons';
import type { DailyDutiesLessonDetailTab } from './daily-duties.types';

interface DeleteDialogState {
  open: boolean;
  error: string | null;
  isLoading: boolean;
  lessonCount: number;
  lesson?: Lesson;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

interface DailyDutiesOverlaysProps {
  isTeacherMode: boolean;
  isAddLessonOpen: boolean;
  onAddLessonOpenChange: (open: boolean) => void;
  substituteLessonModalOpen: boolean;
  substituteLessonId: string | null;
  onSubstituteLessonOpenChange: (open: boolean) => void;
  teacherOptions: Array<{ id: string; label: string }>;
  lessonDetailSheetOpen: boolean;
  lessonDetailSheetId: string | null;
  lessonDetailSheetTab: DailyDutiesLessonDetailTab;
  onLessonDetailSheetOpenChange: (open: boolean) => void;
  bulkDelete: DeleteDialogState;
  singleDelete: DeleteDialogState;
  deleteNotice: { variant: 'success' | 'error'; text: string } | null;
}

export function DailyDutiesOverlays({
  isTeacherMode,
  isAddLessonOpen,
  onAddLessonOpenChange,
  substituteLessonModalOpen,
  substituteLessonId,
  onSubstituteLessonOpenChange,
  teacherOptions,
  lessonDetailSheetOpen,
  lessonDetailSheetId,
  lessonDetailSheetTab,
  onLessonDetailSheetOpenChange,
  bulkDelete,
  singleDelete,
  deleteNotice,
}: DailyDutiesOverlaysProps) {
  const t = useTranslations('dailyDuties');

  return (
    <>
      {!isTeacherMode ? (
        <AddLessonForm open={isAddLessonOpen} onOpenChange={onAddLessonOpenChange} />
      ) : null}

      {!isTeacherMode ? (
        <SubstituteLessonModal
          open={substituteLessonModalOpen}
          onOpenChange={onSubstituteLessonOpenChange}
          lessonId={substituteLessonId}
          teacherOptions={teacherOptions}
        />
      ) : null}

      <AdminLessonDetailSheet
        open={lessonDetailSheetOpen}
        onOpenChange={onLessonDetailSheetOpenChange}
        lessonId={lessonDetailSheetId}
        initialTab={lessonDetailSheetTab}
        teacherOptions={teacherOptions}
        showAdminActions={!isTeacherMode}
      />

      <BulkDeleteConfirmationDialog
        open={bulkDelete.open}
        onOpenChange={bulkDelete.onOpenChange}
        onConfirm={bulkDelete.onConfirm}
        lessonCount={bulkDelete.lessonCount}
        isLoading={bulkDelete.isLoading}
        error={bulkDelete.error}
      />

      {!isTeacherMode ? (
        <BulkDeleteConfirmationDialog
          open={singleDelete.open}
          onOpenChange={singleDelete.onOpenChange}
          onConfirm={singleDelete.onConfirm}
          lessonCount={1}
          isLoading={singleDelete.isLoading}
          error={singleDelete.error}
          title={t('deleteThisLessonTitle')}
          description={
            singleDelete.lesson ? (
              t('deleteLessonPermanentFor', {
                group: singleDelete.lesson.group?.name ?? t('unknownGroup'),
                datetime: new Date(singleDelete.lesson.scheduledAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              })
            ) : (
              t('deleteLessonPermanent')
            )
          }
        />
      ) : null}

      {deleteNotice && (
        <div
          className={cn(
            'fixed right-4 bottom-4 z-50 max-w-sm rounded-[15px] border p-4 shadow-lg',
            deleteNotice.variant === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800',
          )}
          role="status"
        >
          <p className="text-sm font-medium">{deleteNotice.text}</p>
        </div>
      )}
    </>
  );
}
