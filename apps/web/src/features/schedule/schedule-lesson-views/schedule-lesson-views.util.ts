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
