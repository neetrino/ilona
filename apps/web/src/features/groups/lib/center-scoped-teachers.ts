import type { Teacher } from '@/features/teachers';

/** Whether a teacher is associated with a center (explicit links or primary-teacher groups). */
export function isTeacherAtCenter(teacher: Teacher, centerId: string): boolean {
  if (teacher.centers?.some((c) => c.id === centerId)) {
    return true;
  }
  return teacher.centerLinks?.some((l) => l.center.id === centerId) ?? false;
}

export function filterTeachersForCenter(
  teachers: Teacher[],
  centerId: string | undefined,
): Teacher[] {
  if (!centerId) return [];
  return teachers.filter((t) => isTeacherAtCenter(t, centerId));
}

export function teacherOptionLabel(teacher: Teacher): string {
  return `${teacher.user.firstName} ${teacher.user.lastName}`;
}
