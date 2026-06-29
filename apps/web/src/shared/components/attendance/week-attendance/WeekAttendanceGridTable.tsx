'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  ATTENDANCE_CELL_RADIUS_CLASS,
  ATTENDANCE_NOTE_BUTTON_CLASS,
  ATTENDANCE_SMALL_OUTLINE_BUTTON_CLASS,
} from '@/shared/components/attendance/attendance-button-theme';
import type { Lesson } from '@/features/lessons';
import { formatDateString, formatDateDisplay, isToday } from '@/features/attendance/utils/dateUtils';
import type { AttendanceCell, AttendanceStatus, WeekAttendanceStudent } from './types';
import { formatDayHeader, getStatusIcon, getStatusStyles } from './attendance-status';

interface WeekAttendanceGridTableProps {
  gridRef: React.RefObject<HTMLDivElement | null>;
  students: WeekAttendanceStudent[];
  weekDates: Date[];
  locale: string;
  lessonsByDate: Record<string, Lesson[]>;
  attendanceData: Record<string, Record<string, AttendanceCell>>;
  pendingChanges: Record<string, Set<string>>;
  isSaving: Record<string, boolean>;
  isEditMode: boolean;
  getCellStatus: (studentId: string, date: Date) => { status: AttendanceStatus; lessonId: string | null };
  getStatusLabel: (status: AttendanceStatus) => string;
  getNextMarkLabel: (status: AttendanceStatus) => string;
  onToggleCell: (studentId: string, date: Date) => void;
  onDaySave: (date: Date) => void;
  onOpenCommentPreview: (studentId: string, dateStr: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
}

export function WeekAttendanceGridTable({
  gridRef,
  students,
  weekDates,
  locale,
  lessonsByDate,
  attendanceData,
  pendingChanges,
  isSaving,
  isEditMode,
  getCellStatus,
  getStatusLabel,
  getNextMarkLabel,
  onToggleCell,
  onDaySave,
  onOpenCommentPreview,
  t,
  tCommon,
}: WeekAttendanceGridTableProps) {
  return (
    <div
      ref={gridRef}
      className="flex flex-col overflow-hidden rounded-lg border-2 border-slate-300 bg-white shadow-sm"
      style={{ height: 'calc(100vh - 500px)', minHeight: '400px', maxHeight: '600px' }}
    >
      <div className="relative flex-1 overflow-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th
                className="sticky left-0 top-0 z-40 min-w-[180px] border-b-2 border-r-2 border-slate-400 bg-slate-100 px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-slate-900 shadow-[0_2px_6px_rgba(15,23,42,0.08)] md:min-w-[220px] md:px-5"
              >
                <div className="flex items-center gap-2">
                  <span>{t('studentColumn')}</span>
                </div>
              </th>
              {weekDates.map((date) => {
                const { dayName, dayNum, month } = formatDayHeader(date, locale);
                const dateStr = formatDateString(date);
                const dayLessons = lessonsByDate[dateStr] || [];
                const isTodayDate = isToday(date);
                const hasLessons = dayLessons.length > 0;
                const isDateSaving = isSaving[dateStr] || false;
                const hasDateChanges = pendingChanges[dateStr] && pendingChanges[dateStr].size > 0;

                return (
                  <th
                    key={dateStr}
                    className="sticky top-0 z-30 min-w-[100px] border-b-2 border-r-2 border-slate-400 bg-slate-100 px-2 py-3 text-center shadow-[0_2px_6px_rgba(15,23,42,0.08)] md:min-w-[120px] md:px-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          'text-xs font-semibold md:text-sm',
                          isTodayDate ? 'text-primary' : 'text-slate-800',
                        )}
                      >
                        {dayName}
                      </div>
                      <div
                        className={cn(
                          'text-lg font-bold md:text-xl',
                          isTodayDate ? 'text-primary' : 'text-slate-900',
                        )}
                      >
                        {dayNum}
                      </div>
                      <div className="text-[10px] font-medium text-slate-600 md:text-[11px]">{month}</div>
                      {hasLessons ? (
                        <div className="mt-1 text-[10px] text-slate-500">
                          {t('sessionsCount', { count: dayLessons.length })}
                        </div>
                      ) : (
                        <div className="mt-1 text-[10px] italic text-slate-400">
                          {t('noSessionsScheduled')}
                        </div>
                      )}
                      {hasDateChanges && !isDateSaving && (
                        <div className="mt-1">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDaySave(date);
                            }}
                            size="sm"
                            variant="outline"
                            className={ATTENDANCE_SMALL_OUTLINE_BUTTON_CLASS}
                            disabled={isDateSaving}
                          >
                            {tCommon('save')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-200 bg-white">
            {students.map((student) => {
              const initials =
                `${student.user.firstName[0] || ''}${student.user.lastName[0] || ''}` || '?';
              return (
                <tr key={student.id} className="transition-colors hover:bg-slate-50">
                  <td className="sticky left-0 z-10 whitespace-nowrap border-b-2 border-r-2 border-slate-400 bg-white px-4 py-4 shadow-[2px_0_6px_rgba(15,23,42,0.06)] md:px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-md md:h-10 md:w-10">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="max-w-[120px] truncate text-sm font-semibold text-slate-900 md:max-w-none md:text-base">
                          {student.user.firstName} {student.user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  {weekDates.map((date) => {
                    const dateStr = formatDateString(date);
                    const dayLessons = lessonsByDate[dateStr] || [];
                    const { status } = getCellStatus(student.id, date);
                    const hasPendingChange = pendingChanges[dateStr]?.has(student.id) || false;
                    const isDateSaving = isSaving[dateStr] || false;
                    const hasLessons = dayLessons.length > 0;
                    const firstLessonId = dayLessons[0]?.id;
                    const cellNote = firstLessonId
                      ? attendanceData[firstLessonId]?.[student.id]?.note?.trim() || ''
                      : '';
                    const hasMissingJustification =
                      status === 'absent_justified' && hasLessons && !cellNote;

                    return (
                      <td
                        key={dateStr}
                        className={cn(
                          'relative min-h-[60px] border-b-2 border-r-2 border-slate-300 px-2 py-3 text-center transition-all md:px-3',
                          getStatusStyles(status),
                          hasPendingChange && 'ring-2 ring-amber-500',
                          hasMissingJustification && 'ring-2 ring-red-500',
                          isEditMode ? 'cursor-pointer' : 'cursor-default',
                          isDateSaving && 'cursor-wait opacity-60',
                          !hasLessons && 'cursor-not-allowed opacity-50',
                        )}
                        onClick={() =>
                          hasLessons && isEditMode && !isDateSaving && onToggleCell(student.id, date)
                        }
                        tabIndex={hasLessons && isEditMode && !isDateSaving ? 0 : -1}
                        role="gridcell"
                        aria-label={t('cellAria', {
                          name: `${student.user.firstName} ${student.user.lastName}`,
                          date: formatDateDisplay(date),
                          status: getStatusLabel(status),
                        })}
                        aria-disabled={!hasLessons || isDateSaving}
                        title={
                          hasLessons
                            ? isEditMode
                              ? t('clickToMarkCycle', { next: getNextMarkLabel(status) })
                              : t('clickPencilToEdit')
                            : t('noSessionsScheduledTitle')
                        }
                      >
                        {hasLessons ? (
                          <>
                            <div
                              className={cn(
                                'relative mx-auto flex h-10 w-10 items-center justify-center text-base font-bold md:h-12 md:w-12 md:text-lg',
                                ATTENDANCE_CELL_RADIUS_CLASS,
                              )}
                            >
                              {getStatusIcon(status)}
                              {isDateSaving && (
                                <div
                                  className={cn(
                                    'absolute inset-0 flex items-center justify-center bg-white/80',
                                    ATTENDANCE_CELL_RADIUS_CLASS,
                                  )}
                                >
                                  <div className="h-4 w-4 animate-spin rounded-full border-[3px] border-current border-t-transparent" />
                                </div>
                              )}
                            </div>
                            {hasPendingChange && !isDateSaving && (
                              <div className="absolute right-2 top-2 h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500 shadow-sm" />
                            )}
                            {hasMissingJustification && !isDateSaving && (
                              <div className="absolute bottom-1 right-1 rounded bg-red-600 px-1 text-[10px] font-semibold text-white">
                                !
                              </div>
                            )}
                            {status === 'absent_justified' && !!cellNote && !isDateSaving && (
                              <button
                                type="button"
                                className={cn('absolute bottom-2 left-1.5', ATTENDANCE_NOTE_BUTTON_CLASS)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenCommentPreview(student.id, dateStr);
                                }}
                                title={t('viewJustificationComment')}
                                aria-label={t('viewJustificationComment')}
                              >
                                {t('noteBadge')}
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="mx-auto flex h-10 w-10 items-center justify-center text-xs text-slate-400 md:h-12 md:w-12">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
