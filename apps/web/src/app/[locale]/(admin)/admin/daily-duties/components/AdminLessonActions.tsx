'use client';

import { useCallback, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDeleteLesson, useLesson } from '@/features/lessons';
import { BulkDeleteConfirmationDialog } from '@/features/lessons/components/BulkDeleteConfirmationDialog';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';
import { getErrorMessage } from '@/shared/lib/api';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { cn } from '@/shared/lib/utils';
import { SubstituteLessonModal, type SubstituteTeacherOption } from './SubstituteLessonModal';

interface AdminLessonActionsProps {
  lessonId: string;
  teacherOptions: SubstituteTeacherOption[];
  onDeleted?: () => void;
  menuClassName?: string;
}

export function AdminLessonActions({
  lessonId,
  teacherOptions,
  onDeleted,
  menuClassName,
}: AdminLessonActionsProps) {
  const t = useTranslations('dailyDuties');
  const tCommon = useTranslations('common');
  const { data: lesson } = useLesson(lessonId);
  const deleteLesson = useDeleteLesson();
  const [substituteOpen, setSubstituteOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsidePress(menuRef, () => setMenuOpen(false), { enabled: menuOpen });

  const handleDeleteDialogOpenChange = useCallback((open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setDeleteError(null);
    }
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteLesson.isPending) return;
    setDeleteError(null);
    try {
      await deleteLesson.mutateAsync(lessonId);
      setIsDeleteDialogOpen(false);
      onDeleted?.();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err, t('failedDeleteLesson')));
    }
  }, [deleteLesson, lessonId, onDeleted, t]);

  const openSubstitute = () => {
    setMenuOpen(false);
    setSubstituteOpen(true);
  };

  const openDelete = () => {
    setMenuOpen(false);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <div ref={menuRef} className={cn('relative shrink-0', menuClassName ?? '-mt-1')}>
        <button
          type="button"
          aria-label={tCommon('actions')}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className={`${ADMIN_ICON_BUTTON_SM_CLASS} text-[#3b3b40] hover:bg-[#f3f3f4]`}
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-30 mt-1 min-w-[11rem] overflow-hidden rounded-[15px] border border-[rgba(14,14,16,0.08)] bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/5"
          >
            <button
              type="button"
              role="menuitem"
              onClick={openSubstitute}
              className="w-full rounded-[15px] px-3 py-2 text-left text-sm text-[#3b3b40] transition-colors hover:bg-[#f6f6f7]"
            >
              {t('substituteTeacherButton')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={openDelete}
              className="w-full rounded-[15px] px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              {tCommon('delete')}
            </button>
          </div>
        ) : null}
      </div>

      <SubstituteLessonModal
        open={substituteOpen}
        onOpenChange={setSubstituteOpen}
        lessonId={lessonId}
        teacherOptions={teacherOptions}
      />

      <BulkDeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={handleDeleteConfirm}
        lessonCount={1}
        isLoading={deleteLesson.isPending}
        error={deleteError}
        title={t('deleteThisLessonTitle')}
        description={t('deleteLessonPermanentFor', {
          group: lesson?.group?.name ?? t('unknownGroup'),
          datetime: lesson
            ? new Date(lesson.scheduledAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : '',
        })}
        confirmLabel={tCommon('delete')}
      />
    </>
  );
}
