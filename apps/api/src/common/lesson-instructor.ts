import type { Prisma } from '@ilona/database';

/** Teacher who performs the class and receives salary for this lesson occurrence. */
export function effectiveLessonInstructorTeacherId(lesson: {
  teacherId: string;
  substituteTeacherId: string | null | undefined;
}): string {
  return lesson.substituteTeacherId ?? lesson.teacherId;
}

export function teacherActsAsLessonInstructor(
  lesson: { teacherId: string; substituteTeacherId: string | null | undefined },
  actorTeacherProfileId: string,
): boolean {
  return effectiveLessonInstructorTeacherId(lesson) === actorTeacherProfileId;
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
