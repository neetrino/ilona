'use client';

import { cn } from '@/shared/lib/utils';
import {
  ATTENDANCE_CARD_RADIUS_CLASS,
  ATTENDANCE_CELL_RADIUS_CLASS,
  ATTENDANCE_NOTE_BUTTON_CLASS,
} from '@/shared/components/attendance/attendance-button-theme';
import type { Lesson } from '@/features/lessons';
import type { AttendanceCell, AttendanceStatus, WeekAttendanceStudent } from '../week-attendance/types';
import { getStatusIcon, getStatusStyles } from '../week-attendance/attendance-status';

interface AttendanceGridTableProps {
  gridRef: React.RefObject<HTMLDivElement | null>;
  cellRefs: React.MutableRefObject<Record<string, HTMLTableCellElement>>;
  students: WeekAttendanceStudent[];
  sortedLessons: Lesson[];
  attendanceData: Record<string, Record<string, AttendanceCell>>;
  pendingChanges: Record<string, Set<string>>;
  isSaving: Record<string, boolean>;
  isEditMode: boolean;
  focusedCell: { studentId: string; lessonId: string } | null;
  getCellStatus: (studentId: string, lessonId: string) => AttendanceStatus;
  getStatusLabel: (status: AttendanceStatus) => string;
  getNextMarkLabel: (status: AttendanceStatus) => string;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  onToggleCell: (studentId: string, lessonId: string) => void;
  onKeyDown: (e: React.KeyboardEvent, studentId: string, lessonId: string) => void;
  onOpenCommentPreview: (studentId: string, lessonId: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function AttendanceGridTable({
  gridRef,
  cellRefs,
  students,
  sortedLessons,
  attendanceData,
  pendingChanges,
  isSaving,
  isEditMode,
  focusedCell,
  getCellStatus,
  getStatusLabel,
  getNextMarkLabel,
  formatDate,
  formatTime,
  onToggleCell,
  onKeyDown,
  onOpenCommentPreview,
  t,
}: AttendanceGridTableProps) {
  return (
    <div
      ref={gridRef}
      className={cn(
        'flex flex-col overflow-hidden border-2 border-slate-300 bg-white shadow-sm',
        ATTENDANCE_CARD_RADIUS_CLASS,
      )}
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
              {sortedLessons.map((lesson) => (
                <th
                  key={lesson.id}
                  className="sticky top-0 z-30 min-w-[90px] border-b-2 border-r-2 border-slate-400 bg-slate-100 px-2 py-3 text-center shadow-[0_2px_6px_rgba(15,23,42,0.08)] md:min-w-[110px] md:px-3"
                >
                  <div className="mb-1 text-xs font-semibold text-slate-800 md:text-sm">
                    {formatTime(lesson.scheduledAt)}
                  </div>
                  {lesson.topic && (
                    <div
                      className="max-w-[90px] truncate text-[10px] font-medium text-slate-600 md:max-w-[110px] md:text-[11px]"
                      title={lesson.topic}
                    >
                      {lesson.topic}
                    </div>
                  )}
                </th>
              ))}
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
                  {sortedLessons.map((lesson) => {
                    const status = getCellStatus(student.id, lesson.id);
                    const isFocused =
                      focusedCell?.studentId === student.id && focusedCell?.lessonId === lesson.id;
                    const hasPendingChange = pendingChanges[lesson.id]?.has(student.id) || false;
                    const isLessonSaving = isSaving[lesson.id] || false;
                    const cellNote = attendanceData[lesson.id]?.[student.id]?.note?.trim() || '';
                    const hasJustification = !!cellNote;
                    const hasMissingJustification = status === 'absent_justified' && !hasJustification;
                    const cellKey = `${student.id}-${lesson.id}`;

                    return (
                      <td
                        key={cellKey}
                        ref={(el) => {
                          if (el) cellRefs.current[cellKey] = el;
                        }}
                        className={cn(
                          'relative min-h-[60px] border-b-2 border-r-2 border-slate-300 px-2 py-3 text-center transition-all md:px-3',
                          getStatusStyles(status),
                          isFocused && 'shadow-lg ring-4 ring-primary ring-offset-2',
                          hasPendingChange && 'ring-2 ring-amber-500',
                          hasMissingJustification && 'ring-2 ring-red-500',
                          isEditMode ? 'cursor-pointer' : 'cursor-default',
                          isLessonSaving && 'cursor-wait opacity-60',
                        )}
                        onClick={() => isEditMode && !isLessonSaving && onToggleCell(student.id, lesson.id)}
                        onKeyDown={(e) =>
                          isEditMode && !isLessonSaving && onKeyDown(e, student.id, lesson.id)
                        }
                        tabIndex={isLessonSaving || !isEditMode ? -1 : 0}
                        role="gridcell"
                        aria-label={t('cellAria', {
                          name: `${student.user.firstName} ${student.user.lastName}`,
                          date: `${formatDate(lesson.scheduledAt)} ${formatTime(lesson.scheduledAt)}`,
                          status: getStatusLabel(status),
                        })}
                        aria-disabled={isLessonSaving}
                        title={
                          isEditMode
                            ? t('clickToMarkCycle', { next: getNextMarkLabel(status) })
                            : t('clickPencilToEdit')
                        }
                      >
                        <div
                          className={cn(
                            'relative mx-auto flex h-10 w-10 items-center justify-center text-base font-bold md:h-12 md:w-12 md:text-lg',
                            ATTENDANCE_CELL_RADIUS_CLASS,
                          )}
                        >
                          {getStatusIcon(status)}
                          {isLessonSaving && (
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
                        {hasPendingChange && !isLessonSaving && (
                          <div className="absolute right-2 top-2 h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500 shadow-sm" />
                        )}
                        {hasMissingJustification && !isLessonSaving && (
                          <div className="absolute bottom-1 right-1 rounded bg-red-600 px-1 text-[10px] font-semibold text-white">
                            !
                          </div>
                        )}
                        {status === 'absent_justified' && hasJustification && !isLessonSaving && (
                          <button
                            type="button"
                            className={cn('absolute bottom-2 left-1.5', ATTENDANCE_NOTE_BUTTON_CLASS)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCommentPreview(student.id, lesson.id);
                            }}
                            title={t('viewJustificationComment')}
                            aria-label={t('viewJustificationComment')}
                          >
                            {t('noteBadge')}
                          </button>
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
