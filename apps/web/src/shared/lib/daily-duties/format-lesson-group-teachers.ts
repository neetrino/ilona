import type { Lesson } from '@/features/lessons/types';

type TeacherUserRef = {
  user?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
} | null;

function teacherDisplayName(teacher: TeacherUserRef, fallback?: string): string | null {
  if (!teacher?.user) return fallback ?? null;
  const name = `${teacher.user.firstName ?? ''} ${teacher.user.lastName ?? ''}`.trim();
  return name || fallback || null;
}

/**
 * Display name of the teacher assigned to this lesson occurrence
 * (`lesson.teacherId`), not the full group teacher pair.
 */
export function getLessonAssignedTeacherName(
  lesson: Pick<Lesson, 'teacher'>,
  unknownTeacher: string,
): string {
  return teacherDisplayName(lesson.teacher, unknownTeacher) ?? unknownTeacher;
}

/** Assigned teacher FirstName LastName for Daily Duties list/week cards. */
export function formatLessonGroupTeachersLabel(
  lesson: Pick<Lesson, 'teacher'>,
  unknownTeacher: string,
): string {
  return getLessonAssignedTeacherName(lesson, unknownTeacher);
}
