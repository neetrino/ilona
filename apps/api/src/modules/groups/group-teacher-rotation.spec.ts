import { describe, expect, it } from 'vitest';
import { resolveRotatingTeacherId, weekIndexSinceScheduleStart } from './group-teacher-rotation';

const TEACHER_1 = 'teacher-1';
const TEACHER_2 = 'teacher-2';
const SCHEDULE_START = '2026-06-25';

function lessonAt(ymd: string, hour = 10): Date {
  const d = new Date(`${ymd}T00:00:00`);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function resolveTeacher(ymd: string, hour = 10, secondTeacherStartsFirstWeek = false): string {
  return resolveRotatingTeacherId({
    lessonDate: lessonAt(ymd, hour),
    teacherId: TEACHER_1,
    secondTeacherId: TEACHER_2,
    scheduleStartDateYmd: SCHEDULE_START,
    secondTeacherStartsFirstWeek,
  });
}

describe('group-teacher-rotation', () => {
  it('uses week 0 for the ISO week that contains the schedule start date', () => {
    expect(weekIndexSinceScheduleStart(lessonAt('2026-06-25'), SCHEDULE_START)).toBe(0);
    expect(weekIndexSinceScheduleStart(lessonAt('2026-06-28'), SCHEDULE_START)).toBe(0);
  });

  it('assigns Teacher 1 to all lessons in the first ISO week from start date', () => {
    expect(resolveTeacher('2026-06-25')).toBe(TEACHER_1);
    expect(resolveTeacher('2026-06-26')).toBe(TEACHER_1);
    expect(resolveTeacher('2026-06-28')).toBe(TEACHER_1);
  });

  it('assigns Teacher 2 to the next ISO week', () => {
    expect(resolveTeacher('2026-06-29')).toBe(TEACHER_2);
    expect(resolveTeacher('2026-07-02')).toBe(TEACHER_2);
    expect(resolveTeacher('2026-07-05')).toBe(TEACHER_2);
  });

  it('alternates back to Teacher 1 on the third ISO week', () => {
    expect(resolveTeacher('2026-07-06')).toBe(TEACHER_1);
    expect(resolveTeacher('2026-07-12')).toBe(TEACHER_1);
  });

  it('assigns the same teacher to every slot within one ISO week', () => {
    expect(resolveTeacher('2026-06-25', 9)).toBe(resolveTeacher('2026-06-25', 18));
    expect(resolveTeacher('2026-06-30', 9)).toBe(resolveTeacher('2026-07-02', 18));
  });

  it('assigns Teacher 2 to the first ISO week when secondTeacherStartsFirstWeek is true', () => {
    expect(resolveTeacher('2026-06-25', 10, true)).toBe(TEACHER_2);
    expect(resolveTeacher('2026-06-28', 10, true)).toBe(TEACHER_2);
  });

  it('assigns Teacher 1 to the second ISO week when secondTeacherStartsFirstWeek is true', () => {
    expect(resolveTeacher('2026-06-29', 10, true)).toBe(TEACHER_1);
    expect(resolveTeacher('2026-07-05', 10, true)).toBe(TEACHER_1);
  });
});
