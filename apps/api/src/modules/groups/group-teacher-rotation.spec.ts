import { describe, expect, it } from 'vitest';
import { resolveRotatingTeacherId } from './group-teacher-rotation';

const TEACHER_1 = 'teacher-1';
const TEACHER_2 = 'teacher-2';

function resolveTeacher(lessonIndex: number, secondTeacherStartsFirstWeek = false): string {
  return resolveRotatingTeacherId({
    lessonIndex,
    teacherId: TEACHER_1,
    secondTeacherId: TEACHER_2,
    secondTeacherStartsFirstWeek,
  });
}

describe('group-teacher-rotation', () => {
  it('assigns Teacher 1 to the first lesson (index 0)', () => {
    expect(resolveTeacher(0)).toBe(TEACHER_1);
  });

  it('assigns Teacher 2 to the second lesson (index 1)', () => {
    expect(resolveTeacher(1)).toBe(TEACHER_2);
  });

  it('alternates back to Teacher 1 on the third lesson', () => {
    expect(resolveTeacher(2)).toBe(TEACHER_1);
  });

  it('alternates Teacher 2 on the fourth lesson', () => {
    expect(resolveTeacher(3)).toBe(TEACHER_2);
  });

  it('follows Mon→Wed→Fri→Mon as T1, T2, T1, T2 (lesson index order)', () => {
    // Same pattern as schedule generation for Mon/Wed/Fri slots.
    const sequence = [0, 1, 2, 3].map((i) => resolveTeacher(i));
    expect(sequence).toEqual([TEACHER_1, TEACHER_2, TEACHER_1, TEACHER_2]);
  });

  it('never assigns the same teacher to two consecutive lessons by default', () => {
    for (let i = 0; i < 20; i++) {
      expect(resolveTeacher(i)).not.toBe(resolveTeacher(i + 1));
    }
  });

  it('assigns Teacher 2 to the first lesson when secondTeacherStartsFirstWeek is true', () => {
    expect(resolveTeacher(0, true)).toBe(TEACHER_2);
  });

  it('assigns Teacher 1 to the second lesson when secondTeacherStartsFirstWeek is true', () => {
    expect(resolveTeacher(1, true)).toBe(TEACHER_1);
  });
});
