import type { Lesson } from '@/features/lessons/types';
import {
  formatScheduleDate,
  scheduleDateKeyFromIso,
} from '@/features/schedule/schedule-dates';

export const TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE = 5;
export const ADMIN_DAILY_DUTIES_LIST_PAGE_SIZE = 10;

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

type LessonTimeRef = Pick<Lesson, 'id' | 'scheduledAt'>;

function sortByStartAsc(a: LessonTimeRef, b: LessonTimeRef): number {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}

function sortByStartDesc(a: LessonTimeRef, b: LessonTimeRef): number {
  return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
}

/**
 * Order lessons for the teacher/admin calendar list.
 *
 * Sections are calendar-day based so a past day can never appear under Upcoming,
 * even if a stale "now" still thinks that day's start is in the future.
 * - completed: local calendar day before today
 * - upcoming: future calendar days, plus not-yet-started lessons today (first 2 = next)
 * - today: remaining lessons on today's calendar day
 */
export function buildTeacherDailyDutiesOrderedRows(
  lessons: Lesson[],
  now: Date = new Date(),
): TeacherDailyDutiesOrderedRow[] {
  const todayKey = formatScheduleDate(now);
  const nowMs = now.getTime();

  const completedEarlierDays = lessons
    .filter((l) => {
      const key = scheduleDateKeyFromIso(l.scheduledAt);
      return key !== null && key < todayKey;
    })
    .sort(sortByStartDesc);

  const notYetStartedUpcoming = lessons
    .filter((l) => {
      const key = scheduleDateKeyFromIso(l.scheduledAt);
      if (key === null || key < todayKey) {
        return false;
      }
      if (key > todayKey) {
        return true;
      }
      const start = new Date(l.scheduledAt).getTime();
      return !Number.isNaN(start) && start > nowMs;
    })
    .sort(sortByStartAsc);

  const upcomingTwo = notYetStartedUpcoming.slice(0, 2);
  const upcomingIds = new Set(upcomingTwo.map((l) => l.id));

  const todayLessons = lessons.filter((l) => scheduleDateKeyFromIso(l.scheduledAt) === todayKey);
  const todayRest = todayLessons.filter((l) => !upcomingIds.has(l.id)).sort(sortByStartAsc);

  const laterFuture = notYetStartedUpcoming
    .filter((l) => !upcomingIds.has(l.id) && scheduleDateKeyFromIso(l.scheduledAt) !== todayKey)
    .sort(sortByStartAsc);

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
