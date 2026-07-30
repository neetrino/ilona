import type { Prisma } from '@ilona/database';

export type LessonInstructorFields = {
  teacherId: string;
  substituteTeacherId: string | null | undefined;
};

export type GroupTeacherFields = {
  teacherId: string | null | undefined;
  secondTeacherId: string | null | undefined;
};

/** Teacher who performs the class and receives salary for this lesson occurrence. */
export function effectiveLessonInstructorTeacherId(
  lesson: LessonInstructorFields,
): string {
  return lesson.substituteTeacherId ?? lesson.teacherId;
}

export function teacherActsAsLessonInstructor(
  lesson: LessonInstructorFields,
  actorTeacherProfileId: string,
): boolean {
  return effectiveLessonInstructorTeacherId(lesson) === actorTeacherProfileId;
}

export function isGroupCoTeacher(
  group: GroupTeacherFields | null | undefined,
  actorTeacherProfileId: string,
): boolean {
  if (!group) return false;
  return (
    group.teacherId === actorTeacherProfileId ||
    group.secondTeacherId === actorTeacherProfileId
  );
}

/**
 * Teacher may perform lesson actions (attendance, feedback, start/complete, daily plan, …).
 * Group co-teachers have equal action rights; pay still uses {@link effectiveLessonInstructorTeacherId}.
 */
export function teacherCanActOnLesson(
  lesson: LessonInstructorFields & { group?: GroupTeacherFields | null },
  actorTeacherProfileId: string,
): boolean {
  if (teacherActsAsLessonInstructor(lesson, actorTeacherProfileId)) {
    return true;
  }
  return isGroupCoTeacher(lesson.group, actorTeacherProfileId);
}

/**
 * Lessons a teacher may open / act on in lists (own assigned + co-teacher group lessons).
 * Salary / payee queries must keep using {@link lessonsPayableToTeacherWhere}.
 */
export function lessonsAccessibleToTeacherWhere(
  teacherId: string,
): Prisma.LessonWhereInput {
  return {
    OR: [
      { teacherId, substituteTeacherId: null },
      { substituteTeacherId: teacherId },
      { group: { teacherId } },
      { group: { secondTeacherId: teacherId } },
    ],
  };
}

/** Lessons that count toward this teacher's salary for the month (main-only OR substitute-only). */
export function lessonsPayableToTeacherWhere(teacherId: string): Prisma.LessonWhereInput {
  return {
    OR: [
      { teacherId, substituteTeacherId: null },
      { substituteTeacherId: teacherId },
    ],
  };
}

/** True when this teacher is paid as the substitute for this lesson (not the group's main teacher). */
export function isSubstitutePayeeLesson(
  lesson: { substituteTeacherId: string | null | undefined },
  payeeTeacherId: string,
): boolean {
  return lesson.substituteTeacherId != null && lesson.substituteTeacherId === payeeTeacherId;
}
