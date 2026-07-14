import type { Lesson } from '@/features/lessons';
import { formatAppTimeRange } from '@/shared/lib/app-timezone';

export function formatDailyDutiesLessonTime(
  dateStr: string,
  durationMinutes?: number | null,
): string {
  return formatAppTimeRange(dateStr, durationMinutes);
}

export function isCalendarToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function getWeekLessonCardClass(lesson: Lesson): string {
  const status = lesson.dailyDutiesStatus;
  if (status === 'DONE') {
    return 'bg-green-50 border-green-500';
  }
  if (status === 'CAUTION') {
    return 'bg-red-50 border-red-500';
  }
  if (status === 'WAITING') {
    return 'bg-amber-50 border-amber-500';
  }
  if (status === 'IN_PROGRESS') {
    return 'bg-blue-50 border-blue-500';
  }
  if (lesson.status === 'COMPLETED') {
    return 'bg-green-50 border-green-500';
  }
  if (lesson.status === 'IN_PROGRESS') {
    return 'bg-amber-50 border-amber-500';
  }
  if (lesson.status === 'CANCELLED' || lesson.status === 'MISSED') {
    return 'bg-[#f6f6f7] border-[rgba(14,14,16,0.18)]';
  }
  return 'bg-blue-50 border-blue-500';
}
