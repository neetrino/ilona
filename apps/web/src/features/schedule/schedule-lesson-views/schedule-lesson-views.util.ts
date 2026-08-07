import type { Lesson } from '@/features/lessons';
import { isLessonStartStrictlyInFuture } from '@/features/schedule/schedule-dates';
import { studentScheduleTable } from '@/features/student-ui/tokens';
import { APP_TIMEZONE, formatAppDate, formatAppTimeHHmm, getZonedParts } from '@/shared/lib/app-timezone';
import {
  FUTURE_LESSON_CARD_CLASSES,
  PAST_LESSON_CARD_CLASSES,
} from './schedule-lesson-views.constants';
import type { ScheduleUiVariant } from './schedule-lesson-views.types';

export function formatScheduleTime(dateString: string): string {
  return formatAppTimeHHmm(dateString);
}

function teacherFullName(user?: { firstName?: string; lastName?: string } | null): string {
  return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
}

export type ScheduleLessonTeacherChip = {
  id: string;
  name: string;
  /** True when this teacher owns the lesson occurrence (whose day it is). */
  isDayTeacher: boolean;
};

/**
 * Co-teach: both group teachers, with the lesson assignee marked as day teacher.
 * Single-teacher groups: only the lesson teacher.
 */
export function getScheduleLessonTeacherChips(lesson: Lesson): ScheduleLessonTeacherChip[] {
  const dayTeacherId = lesson.teacherId;
  const primary = lesson.group?.teacher;
  const secondary = lesson.group?.secondTeacher;

  if (primary && secondary && primary.id !== secondary.id) {
    const chips: ScheduleLessonTeacherChip[] = [
      {
        id: primary.id,
        name: teacherFullName(primary.user) || 'Teacher',
        isDayTeacher: primary.id === dayTeacherId,
      },
      {
        id: secondary.id,
        name: teacherFullName(secondary.user) || 'Teacher',
        isDayTeacher: secondary.id === dayTeacherId,
      },
    ];
    // Day teacher first so the active assignment is immediately scannable.
    return chips.sort((a, b) => Number(b.isDayTeacher) - Number(a.isDayTeacher));
  }

  const fallbackName = teacherFullName(lesson.teacher?.user) || 'No teacher';
  return [
    {
      id: lesson.teacher?.id ?? dayTeacherId,
      name: fallbackName,
      isDayTeacher: true,
    },
  ];
}

export function formatMinutesToLabel(totalMinutes: number): string {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatWeekdayLabel(date: Date): string {
  return formatAppDate(date, 'en', { weekday: 'short', timeZone: APP_TIMEZONE }).toUpperCase();
}

export function formatWeekdayShort(date: Date): string {
  return formatAppDate(date, 'en', { weekday: 'short', timeZone: APP_TIMEZONE });
}

export function getLessonTimeBounds(lesson: Lesson): { start: number; end: number } | null {
  const startDate = new Date(lesson.scheduledAt);
  if (Number.isNaN(startDate.getTime())) return null;
  const parts = getZonedParts(startDate);
  const start = parts.hour * 60 + parts.minute;
  const duration = lesson.duration > 0 ? lesson.duration : 60;
  return { start, end: start + duration };
}

export function lessonCardTone(
  lesson: Lesson,
  options: { highlightPastLessonCards: boolean; referenceTime: Date; variant: ScheduleUiVariant },
): string {
  const isStudent = options.variant === 'student';
  if (lesson.status === 'CANCELLED' || lesson.status === 'MISSED') {
    return isStudent ? studentScheduleTable.mutedCard : 'border-slate-200 bg-slate-100';
  }
  if (options.highlightPastLessonCards) {
    if (isLessonStartStrictlyInFuture(lesson.scheduledAt, options.referenceTime)) {
      return isStudent ? studentScheduleTable.futureCard : FUTURE_LESSON_CARD_CLASSES;
    }
    if (lesson.status === 'COMPLETED') return PAST_LESSON_CARD_CLASSES;
    if (lesson.status === 'IN_PROGRESS') return 'border-amber-200 bg-amber-50';
    return PAST_LESSON_CARD_CLASSES;
  }
  if (lesson.status === 'COMPLETED') return PAST_LESSON_CARD_CLASSES;
  if (lesson.status === 'IN_PROGRESS') return 'border-amber-200 bg-amber-50';
  return isStudent ? studentScheduleTable.defaultCard : 'border-primary/15 bg-primary/5';
}
