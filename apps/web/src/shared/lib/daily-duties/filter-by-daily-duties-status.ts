import type { DailyDutiesLessonStatus } from '@ilona/types';
import type { Lesson } from '@/features/lessons';

export const DAILY_DUTIES_STATUS_FILTER_VALUES: DailyDutiesLessonStatus[] = [
  'DONE',
  'CAUTION',
  'IN_PROGRESS',
  'WAITING',
];

/** @deprecated Use multi-select with Set<DailyDutiesLessonStatus> instead. */
export type DailyDutiesStatusFilter = DailyDutiesLessonStatus | '';

export function filterLessonsByDailyDutiesStatuses(
  lessons: Lesson[],
  selectedStatuses: Set<DailyDutiesLessonStatus>,
  totalStatusCount = DAILY_DUTIES_STATUS_FILTER_VALUES.length,
): Lesson[] {
  if (selectedStatuses.size === 0 || selectedStatuses.size >= totalStatusCount) {
    return lessons;
  }
  return lessons.filter(
    (lesson) =>
      lesson.dailyDutiesStatus !== undefined &&
      selectedStatuses.has(lesson.dailyDutiesStatus),
  );
}

/** @deprecated Use filterLessonsByDailyDutiesStatuses instead. */
export function filterLessonsByDailyDutiesStatus(
  lessons: Lesson[],
  status: DailyDutiesStatusFilter,
): Lesson[] {
  if (!status) {
    return lessons;
  }
  return lessons.filter((lesson) => lesson.dailyDutiesStatus === status);
}

export function filterLessonsByDateAndStatuses(
  lessonsByDate: Record<string, Lesson[]>,
  selectedStatuses: Set<DailyDutiesLessonStatus>,
  totalStatusCount = DAILY_DUTIES_STATUS_FILTER_VALUES.length,
): Record<string, Lesson[]> {
  if (selectedStatuses.size === 0 || selectedStatuses.size >= totalStatusCount) {
    return lessonsByDate;
  }
  const filtered: Record<string, Lesson[]> = {};
  for (const [key, dayLessons] of Object.entries(lessonsByDate)) {
    const next = filterLessonsByDailyDutiesStatuses(dayLessons, selectedStatuses, totalStatusCount);
    if (next.length > 0) {
      filtered[key] = next;
    }
  }
  return filtered;
}

/** @deprecated Use filterLessonsByDateAndStatuses instead. */
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
