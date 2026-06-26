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
  preserveTeacherIds: string[] = [],
): Teacher[] {
  if (!centerId) return [];

  let list = teachers.filter((t) => isTeacherAtCenter(t, centerId));

  for (const id of preserveTeacherIds) {
    if (!id || list.some((t) => t.id === id)) continue;
    const current = teachers.find((t) => t.id === id);
    if (current) list = [current, ...list];
  }

  return list;
}

export function teacherOptionLabel(teacher: Teacher): string {
  return `${teacher.user.firstName} ${teacher.user.lastName}`;
}
