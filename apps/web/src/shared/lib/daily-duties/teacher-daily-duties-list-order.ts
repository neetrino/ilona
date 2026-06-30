import type { Lesson } from '@/features/lessons';
import {
  formatScheduleDate,
  scheduleDateKeyFromIso,
} from '@/features/schedule/schedule-dates';

export const TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE = 5;

export type TeacherDailyDutiesRowCategory = 'upcoming-next' | 'upcoming-later' | 'today' | 'completed';

export type TeacherDailyDutiesOrderedRow = {
  lesson: Lesson;
  category: TeacherDailyDutiesRowCategory;
};

export function teacherDailyDutiesRowSection(
  category: TeacherDailyDutiesRowCategory,
): 'upcoming' | 'today' | 'completed' {
  if (category === 'upcoming-next' || category === 'upcoming-later') {
    return 'upcoming';
  }
  if (category === 'today') {
    return 'today';
  }
  return 'completed';
}

export function filterLessonsByLocalDateRange(
  lessons: Lesson[],
  from: Date,
  to: Date,
): Lesson[] {
  const fromKey = formatScheduleDate(from);
  const toKey = formatScheduleDate(to);
  return lessons.filter((lesson) => {
    const key = scheduleDateKeyFromIso(lesson.scheduledAt);
    return key !== null && key >= fromKey && key <= toKey;
  });
}

/** Anchor for section labels when browsing a week that is not the current calendar week. */
export function getDailyDutiesListReferenceDate(weekDates: Date[], now: Date = new Date()): Date {
  const todayKey = formatScheduleDate(now);
  const weekStartKey = formatScheduleDate(weekDates[0]);
  const weekEndKey = formatScheduleDate(weekDates[6]);

  if (weekEndKey < todayKey) {
    const afterWeek = new Date(weekDates[6]);
    afterWeek.setDate(afterWeek.getDate() + 1);
    afterWeek.setHours(0, 0, 0, 0);
    return afterWeek;
  }
  if (weekStartKey > todayKey) {
    const weekStart = new Date(weekDates[0]);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }
  return now;
}

/**
 * Order lessons for the teacher calendar list: completed (earlier calendar days) first so they
 * appear on page 1, then next 2 global future, today's remaining rows, then later future dates.
 * Uses the same local calendar-day basis as `schedule-dates` / week and month views.
 */
export function buildTeacherDailyDutiesOrderedRows(
  lessons: Lesson[],
  now: Date = new Date(),
): TeacherDailyDutiesOrderedRow[] {
  const todayKey = formatScheduleDate(now);
  const nowMs = now.getTime();

  const future = lessons
    .filter((l) => {
      const t = new Date(l.scheduledAt).getTime();
      return !Number.isNaN(t) && t > nowMs;
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const upcomingTwo = future.slice(0, 2);
  const upcomingIds = new Set(upcomingTwo.map((l) => l.id));

  const todayLessons = lessons.filter((l) => scheduleDateKeyFromIso(l.scheduledAt) === todayKey);
  const todayRest = todayLessons
    .filter((l) => !upcomingIds.has(l.id))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const laterFuture = future
    .filter((l) => !upcomingIds.has(l.id) && scheduleDateKeyFromIso(l.scheduledAt) !== todayKey)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const completedEarlierDays = lessons
    .filter((l) => {
      const start = new Date(l.scheduledAt).getTime();
      if (Number.isNaN(start) || start >= nowMs) {
        return false;
      }
      const key = scheduleDateKeyFromIso(l.scheduledAt);
      return key !== null && key < todayKey;
    })
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const rows: TeacherDailyDutiesOrderedRow[] = [];
  for (const lesson of completedEarlierDays) {
    rows.push({ lesson, category: 'completed' });
  }
  for (const lesson of upcomingTwo) {
    rows.push({ lesson, category: 'upcoming-next' });
  }
  for (const lesson of todayRest) {
    rows.push({ lesson, category: 'today' });
  }
  for (const lesson of laterFuture) {
    rows.push({ lesson, category: 'upcoming-later' });
  }
  return rows;
}
