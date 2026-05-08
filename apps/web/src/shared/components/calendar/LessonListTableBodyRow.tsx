'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Badge } from '@/shared/components/ui/badge';
import { CheckCircle2, Pencil } from 'lucide-react';
import type { Lesson } from '@/features/lessons';
import { cn } from '@/shared/lib/utils';
import type { TeacherCalendarRowCategory } from '@/shared/lib/calendar/teacher-calendar-list-order';
import type { ScheduleCardDayStatus } from '@/features/schedule/schedule-dates';

function formatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale === 'hy' ? 'hy-AM' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'hy' ? 'hy-AM' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function StatusIndicator({
  completed,
  isLocked,
  onClick,
  label,
  count,
}: {
  completed: boolean;
  isLocked?: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  const isRedX = !completed && isLocked;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        'inline-flex items-center justify-center min-w-[32px] h-6 px-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        completed
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
          : isRedX
            ? 'bg-red-100 text-red-700 border border-red-300 cursor-not-allowed'
            : 'bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-pointer',
      )}
      title={
        completed
          ? `${label}: Completed`
          : isLocked
            ? `${label}: Locked (cannot be edited)`
            : `${label}: Not completed (click to edit)`
      }
      aria-label={`${label}: ${completed ? 'Completed' : isLocked ? 'Locked' : 'Not completed'}${count !== undefined ? ` (${count})` : ''}`}
    >
      {completed ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'ml-1 text-xs font-medium',
            completed ? 'text-emerald-700' : isRedX ? 'text-red-600' : 'text-slate-500',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export type LessonListTableBodyRowProps = {
  lesson: Lesson;
  locale: string;
  hideTeacherColumn: boolean;
  isTeacher: boolean;
  isSelected: boolean;
  onSelectLesson: (lessonId: string, checked: boolean) => void;
  dateStatus: ScheduleCardDayStatus;
  onObligationClick?: (
    lessonId: string,
    obligation: 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan',
  ) => void;
  onComplete?: (lessonId: string) => void;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onAssignSubstitute?: (lessonId: string) => void;
  scheduleCategory?: TeacherCalendarRowCategory;
  scheduleCategoryLabels: {
    upcoming: string;
    upcomingNext: string;
    today: string;
    completed: string;
    todayPastSlot: string;
  };
};

export function LessonListTableBodyRow({
  lesson,
  locale,
  hideTeacherColumn,
  isTeacher,
  isSelected,
  onSelectLesson,
  dateStatus,
  onObligationClick,
  onComplete,
  onEdit,
  onDelete,
  onAssignSubstitute,
  scheduleCategory,
  scheduleCategoryLabels,
}: LessonListTableBodyRowProps) {
  const router = useRouter();

  const teacherName = lesson.teacher?.user
    ? `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`
    : 'Unknown';

  const getRowColor = () => {
    if (lesson.completionStatus === 'DONE') {
      return 'bg-green-50 hover:bg-green-100';
    }
    if (lesson.completionStatus === 'IN_PROCESS') {
      return 'bg-yellow-50 hover:bg-yellow-100';
    }
    if (dateStatus === 'today') {
      return 'bg-blue-50 hover:bg-blue-100';
    }
    if (dateStatus === 'past') {
      return 'bg-slate-50 hover:bg-slate-100';
    }
    return 'hover:bg-slate-50';
  };

  const rowClassName = cn('transition-colors', getRowColor());
  const isLocked = isTeacher && lesson.isLockedForTeacher;

  const handleView = (lessonId: string) => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/admin/')) {
      router.push(`/admin/calendar/${lessonId}`);
    } else if (currentPath.includes('/teacher/')) {
      router.push(`/teacher/calendar/${lessonId}`);
    } else {
      router.push(`/calendar/${lessonId}`);
    }
  };

  const startMs = new Date(lesson.scheduledAt).getTime();
  const isPastInstant = !Number.isNaN(startMs) && startMs < Date.now();

  return (
    <tr className={rowClassName}>
      <td className="px-4 py-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectLesson(lesson.id, checked === true)}
        />
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-semibold text-slate-800">{lesson.group?.name || 'Unknown Group'}</p>
        </div>
      </td>
      <td className="px-4 py-3 align-middle text-center">
        <div className="flex min-h-[1.75rem] items-center justify-center">
          {lesson.completionStatus === 'DONE' && (
            <Badge variant="success" className="bg-green-100 text-green-700 border-green-200">
              Completed
            </Badge>
          )}
          {lesson.completionStatus === 'IN_PROCESS' && (
            <Badge variant="warning" className="bg-yellow-100 text-yellow-700 border-yellow-200">
              In Process
            </Badge>
          )}
        </div>
      </td>
      {scheduleCategory !== undefined && (
        <td className="px-3 py-3 align-middle text-center">
          <div className="flex min-h-[1.75rem] min-w-[7rem] flex-col items-center justify-center gap-1">
            {scheduleCategory === 'upcoming-next' && (
              <>
                <Badge variant="info" className="bg-sky-100 text-sky-800 border-sky-200 text-[10px] uppercase">
                  {scheduleCategoryLabels.upcoming}
                </Badge>
                <Badge variant="default" className="text-[10px] bg-amber-50 text-amber-900 border-amber-200">
                  {scheduleCategoryLabels.upcomingNext}
                </Badge>
              </>
            )}
            {scheduleCategory === 'upcoming-later' && (
              <Badge variant="info" className="bg-sky-100 text-sky-800 border-sky-200 text-[10px] uppercase">
                {scheduleCategoryLabels.upcoming}
              </Badge>
            )}
            {scheduleCategory === 'today' && (
              <>
                <Badge variant="info" className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] uppercase">
                  {scheduleCategoryLabels.today}
                </Badge>
                {isPastInstant && (
                  <span className="text-[10px] font-medium text-slate-500">{scheduleCategoryLabels.todayPastSlot}</span>
                )}
              </>
            )}
            {scheduleCategory === 'completed' && (
              <Badge variant="default" className="bg-slate-200 text-slate-800 border-slate-300 text-[10px] uppercase">
                {scheduleCategoryLabels.completed}
              </Badge>
            )}
          </div>
        </td>
      )}
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-800">{formatDate(lesson.scheduledAt, locale)}</p>
          <p className="text-sm text-slate-600">{formatTime(lesson.scheduledAt, locale)}</p>
        </div>
      </td>
      {!hideTeacherColumn && (
        <td className="px-4 py-3">
          <p className="text-sm text-slate-700">{teacherName}</p>
          {lesson.substituteTeacher?.user && (
            <p className="text-xs text-amber-800 mt-1">
              Sub: {lesson.substituteTeacher.user.firstName} {lesson.substituteTeacher.user.lastName}
            </p>
          )}
        </td>
      )}
      <td className="px-2 py-3 text-center align-middle">
        <div className="flex items-center justify-center">
          <StatusIndicator
            completed={lesson.absenceMarked || false}
            isLocked={lesson.isAbsenceLocked || (lesson.status === 'COMPLETED' && !lesson.absenceMarked)}
            onClick={() => onObligationClick?.(lesson.id, 'absence')}
            label="Absence"
          />
        </div>
      </td>
      <td className="px-2 py-3 text-center align-middle">
        <div className="flex items-center justify-center">
          <StatusIndicator
            completed={lesson.feedbacksCompleted || false}
            isLocked={lesson.isFeedbackLocked || (lesson.status === 'COMPLETED' && !lesson.feedbacksCompleted)}
            onClick={() => onObligationClick?.(lesson.id, 'feedback')}
            label="Feedbacks"
            count={lesson._count?.feedbacks}
          />
        </div>
      </td>
      <td className="px-2 py-3 text-center align-middle">
        <div className="flex items-center justify-center">
          <StatusIndicator
            completed={lesson.voiceSent || false}
            isLocked={lesson.isVoiceLocked || (lesson.status === 'COMPLETED' && !lesson.voiceSent)}
            onClick={() => onObligationClick?.(lesson.id, 'voice')}
            label="Voice"
          />
        </div>
      </td>
      <td className="px-2 py-3 text-center align-middle">
        <div className="flex items-center justify-center">
          <StatusIndicator
            completed={lesson.textSent || false}
            isLocked={lesson.isTextLocked || (lesson.status === 'COMPLETED' && !lesson.textSent)}
            onClick={() => onObligationClick?.(lesson.id, 'text')}
            label="Text"
          />
        </div>
      </td>
      <td className="px-2 py-3 text-center align-middle">
        <div className="flex items-center justify-center">
          <StatusIndicator
            completed={lesson.dailyPlanCompleted || false}
            isLocked={
              lesson.isDailyPlanLocked || (lesson.status === 'COMPLETED' && !lesson.dailyPlanCompleted)
            }
            onClick={() => onObligationClick?.(lesson.id, 'dailyPlan')}
            label="Daily Plan"
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {!isTeacher && onAssignSubstitute && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAssignSubstitute(lesson.id)}
              className="text-amber-700 hover:text-amber-800"
              title="Assign substitute for this lesson"
            >
              <img
                src="/icons/substitute-teacher.svg"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 shrink-0"
                aria-hidden
              />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(lesson.id)}
            className="text-blue-600 hover:text-blue-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </Button>
          {onComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComplete(lesson.id)}
              disabled={lesson.status === 'COMPLETED' || isLocked}
              className={cn(
                lesson.status === 'COMPLETED' ? 'text-green-600 cursor-default' : 'text-green-600 hover:text-green-700',
                isLocked && 'opacity-50 cursor-not-allowed',
              )}
              title={
                lesson.status === 'COMPLETED'
                  ? 'Lesson already completed'
                  : isLocked
                    ? 'This lesson is locked'
                    : 'Mark lesson as completed'
              }
            >
              {lesson.status === 'COMPLETED' ? (
                <CheckCircle2 className="w-4 h-4 fill-current" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(lesson.id)}
              disabled={isLocked}
              className={cn('text-slate-600 hover:text-slate-700', isLocked && 'opacity-50 cursor-not-allowed')}
              title={isLocked ? 'This lesson is locked for editing' : 'Edit'}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(lesson.id)}
              disabled={isLocked}
              className={cn('text-red-600 hover:text-red-700', isLocked && 'opacity-75 cursor-not-allowed')}
              title={isLocked ? 'This lesson is locked and cannot be deleted' : 'Delete'}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
