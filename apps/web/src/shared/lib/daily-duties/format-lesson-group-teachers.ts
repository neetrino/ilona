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

/** Ordered group teacher display names (Teacher 1, Teacher 2); falls back to lesson assignee. */
export function getLessonGroupTeacherNames(
  lesson: Pick<Lesson, 'teacher' | 'group'>,
  unknownTeacher: string,
): string[] {
  const teacher1 = teacherDisplayName(lesson.group?.teacher ?? null);
  const teacher2 = teacherDisplayName(lesson.group?.secondTeacher ?? null);

  if (teacher1 && teacher2) {
    return [teacher1, teacher2];
  }
  if (teacher1 || teacher2) {
    return [teacher1 || teacher2 || unknownTeacher];
  }

  return [teacherDisplayName(lesson.teacher, unknownTeacher) ?? unknownTeacher];
}

/** Group Teacher 1 · Teacher 2 for Daily Duties list; falls back to lesson assignee. */
export function formatLessonGroupTeachersLabel(
  lesson: Pick<Lesson, 'teacher' | 'group'>,
  unknownTeacher: string,
): string {
  return getLessonGroupTeacherNames(lesson, unknownTeacher).join(' · ');
}
