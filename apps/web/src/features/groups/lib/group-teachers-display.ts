import type { Group } from '../types';

export function getGroupTeacherName(teacher: Group['teacher']): string | null {
  if (!teacher?.user) return null;
  const name = `${teacher.user.firstName} ${teacher.user.lastName}`.trim();
  return name || null;
}

export function getGroupTeachersForDisplay(group: Group): NonNullable<Group['teacher']>[] {
  const teachers: NonNullable<Group['teacher']>[] = [];
  if (group.teacher) {
    teachers.push(group.teacher);
  }
  if (group.secondTeacher && group.secondTeacher.id !== group.teacher?.id) {
    teachers.push(group.secondTeacher);
  }
  return teachers;
}
