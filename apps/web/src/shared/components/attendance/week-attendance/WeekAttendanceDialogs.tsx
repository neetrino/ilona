'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui';
import { ATTENDANCE_PRIMARY_BUTTON_CLASS } from '@/shared/components/attendance/attendance-button-theme';
import {
  JUSTIFICATION_DIALOG_BODY_CLASS,
  JUSTIFICATION_DIALOG_COMMENT_BOX_CLASS,
  JUSTIFICATION_DIALOG_CONTENT_CLASS,
  JUSTIFICATION_DIALOG_HEADER_CLASS,
  JUSTIFICATION_DIALOG_INPUT_CLASS,
  JUSTIFICATION_DIALOG_STUDENT_NAME_CLASS,
} from '@/shared/components/attendance/justification-dialog-theme';
import { DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS } from '@/shared/components/ui/DeleteConfirmationDialog';
import type { Lesson } from '@/features/lessons';
import type { AttendanceCell, WeekAttendanceStudent } from './types';

interface WeekAttendanceDialogsProps {
  students: WeekAttendanceStudent[];
  lessonsByDate: Record<string, Lesson[]>;
  attendanceData: Record<string, Record<string, AttendanceCell>>;
  justificationDialog: { studentId: string; dateStr: string } | null;
  commentPreviewDialog: { studentId: string; dateStr: string } | null;
  onJustificationDialogChange: (open: boolean) => void;
  onCommentPreviewDialogChange: (open: boolean) => void;
  onUpdateDayNote: (studentId: string, dateStr: string, note: string) => void;
  t: (key: string) => string;
}

function getCellNote(
  lessonsByDate: Record<string, Lesson[]>,
  attendanceData: Record<string, Record<string, AttendanceCell>>,
  dateStr: string,
  studentId: string,
) {
  const firstLessonId = lessonsByDate[dateStr]?.[0]?.id;
  if (!firstLessonId) return '';
  return attendanceData[firstLessonId]?.[studentId]?.note ?? '';
}

function getTrimmedCellNote(
  lessonsByDate: Record<string, Lesson[]>,
  attendanceData: Record<string, Record<string, AttendanceCell>>,
  dateStr: string,
  studentId: string,
) {
  return getCellNote(lessonsByDate, attendanceData, dateStr, studentId).trim();
}

export function WeekAttendanceDialogs({
  students,
  lessonsByDate,
  attendanceData,
  justificationDialog,
  commentPreviewDialog,
  onJustificationDialogChange,
  onCommentPreviewDialogChange,
  onUpdateDayNote,
  t,
}: WeekAttendanceDialogsProps) {
  const justificationNote = justificationDialog
    ? getTrimmedCellNote(
        lessonsByDate,
        attendanceData,
        justificationDialog.dateStr,
        justificationDialog.studentId,
      )
    : '';

  return (
    <>
      <Dialog open={!!justificationDialog} onOpenChange={onJustificationDialogChange}>
        <DialogContent
          sheet={false}
          stackOpen={!!justificationDialog}
          overlayClassName={DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS}
          className={JUSTIFICATION_DIALOG_CONTENT_CLASS}
        >
          <DialogHeader className={JUSTIFICATION_DIALOG_HEADER_CLASS}>
            <DialogTitle>{t('justificationRequired')}</DialogTitle>
          </DialogHeader>
          {justificationDialog && (
            <div className={JUSTIFICATION_DIALOG_BODY_CLASS}>
              <div className={JUSTIFICATION_DIALOG_STUDENT_NAME_CLASS}>
                {students.find((s) => s.id === justificationDialog.studentId)?.user.firstName}{' '}
                {students.find((s) => s.id === justificationDialog.studentId)?.user.lastName}
              </div>
              <Input
                value={getCellNote(
                  lessonsByDate,
                  attendanceData,
                  justificationDialog.dateStr,
                  justificationDialog.studentId,
                )}
                onChange={(e) =>
                  onUpdateDayNote(
                    justificationDialog.studentId,
                    justificationDialog.dateStr,
                    e.target.value,
                  )
                }
                placeholder={t('justificationPlaceholder')}
                maxLength={500}
                autoFocus
                className={JUSTIFICATION_DIALOG_INPUT_CLASS}
              />
              {!justificationNote ? (
                <p className="text-xs text-red-600">{t('justificationFieldRequired')}</p>
              ) : null}
            </div>
          )}
          <DialogFooter className="pt-1">
            <Button
              onClick={() => onJustificationDialogChange(false)}
              disabled={!justificationNote}
              className={cn(ATTENDANCE_PRIMARY_BUTTON_CLASS, 'px-4')}
            >
              {t('saveComment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!commentPreviewDialog} onOpenChange={onCommentPreviewDialogChange}>
        <DialogContent
          sheet={false}
          stackOpen={!!commentPreviewDialog}
          overlayClassName={DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS}
          className={JUSTIFICATION_DIALOG_CONTENT_CLASS}
        >
          <DialogHeader className={JUSTIFICATION_DIALOG_HEADER_CLASS}>
            <DialogTitle>{t('justificationCommentTitle')}</DialogTitle>
            <DialogDescription>{t('justificationSavedDescription')}</DialogDescription>
          </DialogHeader>
          {commentPreviewDialog && (
            <div className={JUSTIFICATION_DIALOG_BODY_CLASS}>
              <div className="text-sm font-medium text-slate-700">
                {students.find((s) => s.id === commentPreviewDialog.studentId)?.user.firstName}{' '}
                {students.find((s) => s.id === commentPreviewDialog.studentId)?.user.lastName}
              </div>
              <div className={JUSTIFICATION_DIALOG_COMMENT_BOX_CLASS}>
                {getCellNote(
                  lessonsByDate,
                  attendanceData,
                  commentPreviewDialog.dateStr,
                  commentPreviewDialog.studentId,
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
