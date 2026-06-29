'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLessonAttendance, useMarkBulkAttendance } from '@/features/attendance';
import { useLesson } from '@/features/lessons';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { AutoDismissToast } from '@/shared/components/ui';
import { markAbsenceComplete } from '@/features/lessons/api/obligations.api';
import { useQueryClient } from '@tanstack/react-query';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';
import type { AbsenceType } from '@/features/attendance';
import type { AutoDismissToastVariant } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';
import { DAILY_DUTIES_RADIUS_CLASS } from '@/shared/lib/daily-duties/daily-duties-theme';

interface AbsenceTabProps {
  lessonId: string;
}

type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified' | 'not_marked';

type ToastState = {
  key: number;
  message: string;
  variant: AutoDismissToastVariant;
};

const STATUS_BUTTON_CLASS =
  'px-4 py-2 rounded-[15px] text-sm font-medium transition-colors border-2 shrink-0';

export function AbsenceTab({ lessonId }: AbsenceTabProps) {
  const t = useTranslations('attendance');
  const tCalendar = useTranslations('dailyDuties');
  const queryClient = useQueryClient();
  const { data: lesson } = useLesson(lessonId);
  const { data: attendanceData, isLoading } = useLessonAttendance(lessonId);
  const markBulkAttendance = useMarkBulkAttendance();
  const [attendance, setAttendance] = useState<
    Record<string, { isPresent: boolean; absenceType?: AbsenceType; note?: string }>
  >({});
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, variant: AutoDismissToastVariant) => {
    setToast({ key: Date.now(), message, variant });
  };

  const students = attendanceData?.studentsWithAttendance?.map((swa) => swa.student) || [];

  useEffect(() => {
    if (attendanceData?.studentsWithAttendance && attendanceData.studentsWithAttendance.length > 0) {
      const initial: Record<string, { isPresent: boolean; absenceType?: AbsenceType; note?: string }> = {};

      attendanceData.studentsWithAttendance.forEach((swa) => {
        const savedAttendance = swa.attendance;

        if (savedAttendance) {
          initial[swa.student.id] = {
            isPresent: savedAttendance.isPresent,
            absenceType: savedAttendance.absenceType || undefined,
            note: savedAttendance.note || undefined,
          };
        }
      });

      setAttendance(initial);
      setHasChanges(false);
    }
  }, [attendanceData]);

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    if (status === 'not_marked') return;

    setHasChanges(true);
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        isPresent: status === 'present',
        absenceType:
          status === 'absent_justified'
            ? 'JUSTIFIED'
            : status === 'absent_unjustified'
              ? 'UNJUSTIFIED'
              : undefined,
        note:
          status === 'present' || status === 'not_marked' ? undefined : prev[studentId]?.note,
      },
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setHasChanges(true);
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { isPresent: false, absenceType: 'JUSTIFIED' }),
        note,
      },
    }));
  };

  const handleSave = async () => {
    if (!lesson) return;

    const attendances = students
      .filter((student) => attendance[student.id] !== undefined)
      .map((student) => {
        const att = attendance[student.id];
        if (!att) return null;
        return {
          studentId: student.id,
          isPresent: att.isPresent,
          absenceType: att.absenceType,
          note: att.note?.trim() || undefined,
        };
      })
      .filter((att): att is NonNullable<typeof att> => att !== null);

    try {
      const hasMissingJustification = attendances.some(
        (att) => att.absenceType === 'JUSTIFIED' && !att.note?.trim(),
      );
      if (hasMissingJustification) {
        showToast(t('justificationBeforeSave'), 'error');
        return;
      }

      await markBulkAttendance.mutateAsync({
        lessonId: lesson.id,
        attendances,
      });

      await markAbsenceComplete(lesson.id);

      queryClient.invalidateQueries({ queryKey: lessonKeys.details() });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['finance', 'salaries'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'salaries', 'breakdown'] });

      setHasChanges(false);
      showToast(t('attendanceSaved'), 'success');
    } catch (err: unknown) {
      console.error('Failed to save attendance:', err);
      showToast(t('failedToSaveAttendanceDefault'), 'error');
    }
  };

  const getStatus = (studentId: string): AttendanceStatus => {
    const att = attendance[studentId];
    if (!att) {
      const studentWithAttendance = attendanceData?.studentsWithAttendance?.find(
        (swa) => swa.student.id === studentId,
      );
      const existing = studentWithAttendance?.attendance;
      if (existing) {
        return existing.isPresent
          ? 'present'
          : existing.absenceType === 'JUSTIFIED'
            ? 'absent_justified'
            : 'absent_unjustified';
      }
      return 'not_marked';
    }
    return att.isPresent
      ? 'present'
      : att.absenceType === 'JUSTIFIED'
        ? 'absent_justified'
        : 'absent_unjustified';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-sm text-slate-500">{t('loadingAttendanceData')}</p>
      </div>
    );
  }

  if (attendanceData && students.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>{tCalendar('feedback.noStudentsInLesson')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {toast ? (
        <AutoDismissToast
          key={toast.key}
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{t('editAttendance')}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {attendanceData?.summary && attendanceData.summary.notMarked < attendanceData.summary.total
              ? t('updateAttendanceHint')
              : t('markAttendanceHint')}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={markBulkAttendance.isPending || students.length === 0}
          className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'shrink-0 bg-blue-600 text-white hover:bg-blue-700')}
        >
          {markBulkAttendance.isPending
            ? t('savingAttendance')
            : hasChanges
              ? t('saveAllChanges')
              : t('saveAttendance')}
        </Button>
      </div>

      <div className="space-y-3">
        {students.map((student) => {
          const status = getStatus(student.id);
          const displayName = `${student.user.firstName} ${student.user.lastName}`.trim();
          const initials = `${student.user.firstName[0] ?? ''}${student.user.lastName[0] ?? ''}`;

          return (
            <div
              key={student.id}
              className={cn(
                'border border-slate-200 p-4 hover:bg-slate-50/80',
                DAILY_DUTIES_RADIUS_CLASS,
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600"
                  >
                    {initials}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <p className="shrink-0 font-medium text-slate-800">{displayName}</p>
                    {status === 'absent_justified' ? (
                      <Input
                        placeholder={t('justificationCommentRequired')}
                        value={attendance[student.id]?.note || ''}
                        onChange={(event) => handleNoteChange(student.id, event.target.value)}
                        maxLength={500}
                        className={cn(ADMIN_FORM_INPUT_CLASS, 'min-w-0 flex-1')}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleAttendanceChange(student.id, 'present')}
                    className={cn(
                      STATUS_BUTTON_CLASS,
                      status === 'present'
                        ? 'border-green-500 bg-green-100 text-green-700'
                        : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    {t('present')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAttendanceChange(student.id, 'absent_justified')}
                    className={cn(
                      STATUS_BUTTON_CLASS,
                      status === 'absent_justified'
                        ? 'border-yellow-500 bg-yellow-100 text-yellow-700'
                        : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    {t('justified')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAttendanceChange(student.id, 'absent_unjustified')}
                    className={cn(
                      STATUS_BUTTON_CLASS,
                      status === 'absent_unjustified'
                        ? 'border-red-500 bg-red-100 text-red-700'
                        : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    {t('unjustified')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
