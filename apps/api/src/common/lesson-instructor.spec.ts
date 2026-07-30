import { describe, expect, it } from 'vitest';
import {
  effectiveLessonInstructorTeacherId,
  lessonsAccessibleToTeacherWhere,
  lessonsPayableToTeacherWhere,
  teacherActsAsLessonInstructor,
  teacherCanActOnLesson,
} from './lesson-instructor';

const TEACHER_X = 'teacher-x';
const TEACHER_Y = 'teacher-y';
const OUTSIDER = 'teacher-outsider';
const SUBSTITUTE = 'teacher-sub';

const groupXY = { teacherId: TEACHER_X, secondTeacherId: TEACHER_Y };

describe('lesson-instructor — co-teacher access vs pay', () => {
  it('pays the assigned lesson teacher even when the co-teacher acts', () => {
    const lesson = {
      teacherId: TEACHER_Y,
      substituteTeacherId: null,
      group: groupXY,
    };

    expect(teacherCanActOnLesson(lesson, TEACHER_X)).toBe(true);
    expect(teacherActsAsLessonInstructor(lesson, TEACHER_X)).toBe(false);
    expect(effectiveLessonInstructorTeacherId(lesson)).toBe(TEACHER_Y);
  });

  it('allows the assigned teacher to act on their own lesson', () => {
    const lesson = {
      teacherId: TEACHER_Y,
      substituteTeacherId: null,
      group: groupXY,
    };

    expect(teacherCanActOnLesson(lesson, TEACHER_Y)).toBe(true);
    expect(teacherActsAsLessonInstructor(lesson, TEACHER_Y)).toBe(true);
    expect(effectiveLessonInstructorTeacherId(lesson)).toBe(TEACHER_Y);
  });

  it('allows Teacher Y to act on Teacher X lesson day', () => {
    const lesson = {
      teacherId: TEACHER_X,
      substituteTeacherId: null,
      group: groupXY,
    };

    expect(teacherCanActOnLesson(lesson, TEACHER_Y)).toBe(true);
    expect(effectiveLessonInstructorTeacherId(lesson)).toBe(TEACHER_X);
  });

  it('denies a teacher who is not on the group', () => {
    const lesson = {
      teacherId: TEACHER_Y,
      substituteTeacherId: null,
      group: groupXY,
    };

    expect(teacherCanActOnLesson(lesson, OUTSIDER)).toBe(false);
  });

  it('denies co-teacher access when group is missing from the payload', () => {
    const lesson = {
      teacherId: TEACHER_Y,
      substituteTeacherId: null,
    };

    expect(teacherCanActOnLesson(lesson, TEACHER_X)).toBe(false);
    expect(teacherCanActOnLesson(lesson, TEACHER_Y)).toBe(true);
  });

  it('allows the substitute instructor and still pays the substitute', () => {
    const lesson = {
      teacherId: TEACHER_Y,
      substituteTeacherId: SUBSTITUTE,
      group: groupXY,
    };

    expect(teacherCanActOnLesson(lesson, SUBSTITUTE)).toBe(true);
    expect(teacherCanActOnLesson(lesson, TEACHER_X)).toBe(true);
    expect(effectiveLessonInstructorTeacherId(lesson)).toBe(SUBSTITUTE);
    expect(teacherActsAsLessonInstructor(lesson, TEACHER_Y)).toBe(false);
  });

  it('keeps payable where scoped to assigned / substitute only (not co-teacher)', () => {
    expect(lessonsPayableToTeacherWhere(TEACHER_X)).toEqual({
      OR: [
        { teacherId: TEACHER_X, substituteTeacherId: null },
        { substituteTeacherId: TEACHER_X },
      ],
    });
  });

  it('expands accessible where to include co-teacher group lessons', () => {
    expect(lessonsAccessibleToTeacherWhere(TEACHER_X)).toEqual({
      OR: [
        { teacherId: TEACHER_X, substituteTeacherId: null },
        { substituteTeacherId: TEACHER_X },
        { group: { teacherId: TEACHER_X } },
        { group: { secondTeacherId: TEACHER_X } },
      ],
    });
  });

  it('matrix: every group teacher can act on every alternating day; pay stays assigned', () => {
    const days = [
      { teacherId: TEACHER_X, actor: TEACHER_X, canAct: true, payee: TEACHER_X },
      { teacherId: TEACHER_X, actor: TEACHER_Y, canAct: true, payee: TEACHER_X },
      { teacherId: TEACHER_Y, actor: TEACHER_X, canAct: true, payee: TEACHER_Y },
      { teacherId: TEACHER_Y, actor: TEACHER_Y, canAct: true, payee: TEACHER_Y },
      { teacherId: TEACHER_Y, actor: OUTSIDER, canAct: false, payee: TEACHER_Y },
    ];

    for (const day of days) {
      const lesson = {
        teacherId: day.teacherId,
        substituteTeacherId: null,
        group: groupXY,
      };
      expect(teacherCanActOnLesson(lesson, day.actor)).toBe(day.canAct);
      expect(effectiveLessonInstructorTeacherId(lesson)).toBe(day.payee);
    }
  });

  it('accessible where is a strict superset of payable where for a co-teacher', () => {
    const payable = lessonsPayableToTeacherWhere(TEACHER_X);
    const accessible = lessonsAccessibleToTeacherWhere(TEACHER_X);
    expect(accessible.OR).toEqual(
      expect.arrayContaining([
        ...(payable.OR as object[]),
        { group: { teacherId: TEACHER_X } },
        { group: { secondTeacherId: TEACHER_X } },
      ]),
    );
    expect((accessible.OR as unknown[]).length).toBeGreaterThan((payable.OR as unknown[]).length);
  });
});
