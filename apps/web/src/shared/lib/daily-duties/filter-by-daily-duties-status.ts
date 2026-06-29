import type { DailyDutiesLessonStatus } from '@ilona/types';
import type { Lesson } from '@/features/lessons';

export type DailyDutiesStatusFilter = DailyDutiesLessonStatus | '';

export function filterLessonsByDailyDutiesStatus(
  lessons: Lesson[],
  status: DailyDutiesStatusFilter,
): Lesson[] {
  if (!status) {
    return lessons;
  }
  return lessons.filter((lesson) => lesson.dailyDutiesStatus === status);
}

export function filterLessonsByDateAndStatus(
  lessonsByDate: Record<string, Lesson[]>,
  status: DailyDutiesStatusFilter,
): Record<string, Lesson[]> {
  if (!status) {
    return lessonsByDate;
  }
  const filtered: Record<string, Lesson[]> = {};
  for (const [key, dayLessons] of Object.entries(lessonsByDate)) {
    const next = filterLessonsByDailyDutiesStatus(dayLessons, status);
    if (next.length > 0) {
      filtered[key] = next;
    }
  }
  return filtered;
}
