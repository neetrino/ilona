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
import type { AttendanceCell, WeekAttendanceStudent } from '../week-attendance/types';

interface AttendanceGridDialogsProps {
  students: WeekAttendanceStudent[];
  attendanceData: Record<string, Record<string, AttendanceCell>>;
  justificationDialog: { studentId: string; lessonId: string } | null;
  commentPreviewDialog: { studentId: string; lessonId: string } | null;
  onJustificationDialogChange: (open: boolean) => void;
  onCommentPreviewDialogChange: (open: boolean) => void;
  onUpdateCellNote: (studentId: string, lessonId: string, note: string) => void;
  t: (key: string) => string;
}

function getCellNote(
  attendanceData: Record<string, Record<string, AttendanceCell>>,
  lessonId: string,
  studentId: string,
) {
  return attendanceData[lessonId]?.[studentId]?.note ?? '';
}

function getTrimmedCellNote(
  attendanceData: Record<string, Record<string, AttendanceCell>>,
  lessonId: string,
  studentId: string,
) {
  return getCellNote(attendanceData, lessonId, studentId).trim();
}

export function AttendanceGridDialogs({
  students,
  attendanceData,
  justificationDialog,
  commentPreviewDialog,
  onJustificationDialogChange,
  onCommentPreviewDialogChange,
  onUpdateCellNote,
  t,
}: AttendanceGridDialogsProps) {
  const justificationNote = justificationDialog
    ? getTrimmedCellNote(attendanceData, justificationDialog.lessonId, justificationDialog.studentId)
    : '';

  return (
    <>
      <Dialog open={!!justificationDialog} onOpenChange={onJustificationDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('justificationRequired')}</DialogTitle>
            <DialogDescription>{t('addJustificationReason')}</DialogDescription>
          </DialogHeader>
          {justificationDialog && (
            <div className="space-y-2">
              <div className="text-sm text-slate-600">
                {students.find((s) => s.id === justificationDialog.studentId)?.user.firstName}{' '}
                {students.find((s) => s.id === justificationDialog.studentId)?.user.lastName}
              </div>
              <Input
                value={getCellNote(
                  attendanceData,
                  justificationDialog.lessonId,
                  justificationDialog.studentId,
                )}
                onChange={(e) =>
                  onUpdateCellNote(
                    justificationDialog.studentId,
                    justificationDialog.lessonId,
                    e.target.value,
                  )
                }
                placeholder={t('justificationPlaceholder')}
                maxLength={500}
                autoFocus
              />
              {!justificationNote ? (
                <p className="text-xs text-red-600">{t('justificationFieldRequired')}</p>
              ) : null}
            </div>
          )}
          <DialogFooter>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('justificationCommentTitle')}</DialogTitle>
            <DialogDescription>{t('justificationSavedDescription')}</DialogDescription>
          </DialogHeader>
          {commentPreviewDialog && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">
                {students.find((s) => s.id === commentPreviewDialog.studentId)?.user.firstName}{' '}
                {students.find((s) => s.id === commentPreviewDialog.studentId)?.user.lastName}
              </div>
              <div className="rounded-[15px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                {getCellNote(
                  attendanceData,
                  commentPreviewDialog.lessonId,
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
