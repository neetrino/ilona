/**
 * Regression tests for Daily Duties list order (imports the real module).
 * Run from repo root:
 *   pnpm dlx tsx apps/web/src/shared/lib/daily-duties/teacher-daily-duties-list-order.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  buildTeacherDailyDutiesOrderedRows,
  getDailyDutiesListReferenceDate,
  teacherDailyDutiesRowSection,
} from './teacher-daily-duties-list-order.ts';
import type { Lesson } from '@/features/lessons/types';

function localIso(y: number, m: number, d: number, h: number, min = 0): string {
  return new Date(y, m - 1, d, h, min, 0, 0).toISOString();
}

function stubLesson(id: string, scheduledAt: string): Lesson {
  return {
    id,
    groupId: 'g',
    teacherId: 't',
    scheduledAt,
    duration: 60,
    status: 'SCHEDULED',
    vocabularySent: false,
    group: { id: 'g', name: id },
    teacher: {
      id: 't',
      user: { id: 'u', firstName: 'T', lastName: 'Eacher' },
    },
  };
}

function sectionOf(
  rows: ReturnType<typeof buildTeacherDailyDutiesOrderedRows>,
  id: string,
): 'upcoming' | 'today' | 'completed' {
  const row = rows.find((r) => r.lesson.id === id);
  assert.ok(row, `missing lesson ${id}`);
  return teacherDailyDutiesRowSection(row.category);
}

// Bug repro from Daily Duties UI: past days must not stay under Upcoming when today is later.
{
  const now = new Date(2026, 7, 7, 19, 0, 0, 0);
  const lessons = [
    stubLesson('aug3-a', localIso(2026, 8, 3, 13, 30)),
    stubLesson('aug3-b', localIso(2026, 8, 3, 10, 0)),
    stubLesson('aug4', localIso(2026, 8, 4, 10, 0)),
    stubLesson('aug5-g', localIso(2026, 8, 5, 17, 30)),
    stubLesson('aug5-o', localIso(2026, 8, 5, 19, 30)),
  ];
  const rows = buildTeacherDailyDutiesOrderedRows(lessons, now);
  assert.equal(sectionOf(rows, 'aug3-a'), 'completed');
  assert.equal(sectionOf(rows, 'aug3-b'), 'completed');
  assert.equal(sectionOf(rows, 'aug4'), 'completed');
  assert.equal(sectionOf(rows, 'aug5-g'), 'completed');
  assert.equal(sectionOf(rows, 'aug5-o'), 'completed');
  console.log('ok: past calendar days always completed');
}

{
  const staleMorning = new Date(2026, 7, 4, 9, 0, 0, 0);
  const lessons = [
    stubLesson('aug3', localIso(2026, 8, 3, 13, 30)),
    stubLesson('aug4', localIso(2026, 8, 4, 10, 0)),
    stubLesson('aug5', localIso(2026, 8, 5, 17, 30)),
  ];
  const rows = buildTeacherDailyDutiesOrderedRows(lessons, staleMorning);
  assert.equal(sectionOf(rows, 'aug3'), 'completed');
  assert.equal(sectionOf(rows, 'aug4'), 'upcoming');
  assert.equal(sectionOf(rows, 'aug5'), 'upcoming');
  console.log('ok: same-day classification with morning clock');
}

{
  const afterStart = new Date(2026, 7, 4, 11, 0, 0, 0);
  const lessons = [stubLesson('aug4', localIso(2026, 8, 4, 10, 0))];
  const rows = buildTeacherDailyDutiesOrderedRows(lessons, afterStart);
  assert.equal(sectionOf(rows, 'aug4'), 'today');
  console.log('ok: started today → today section');
}

{
  const weekDates = Array.from({ length: 7 }, (_, i) => new Date(2026, 7, 3 + i));
  const now = new Date(2026, 7, 7, 19, 0, 0, 0);
  const ref = getDailyDutiesListReferenceDate(weekDates, now);
  assert.equal(ref.getTime(), now.getTime());
  console.log('ok: listReferenceDate for current week');
}

console.log('\nAll teacher-daily-duties-list-order regressions passed.');
