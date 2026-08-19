import type { TeacherAssignedItem } from '@/features/students';
import { getItemId, isOnboardingItem } from '@/features/students';

/** Strict group id: onboarding leads and inconsistent assignments are excluded. */
export function resolveStudentGroupId(student: TeacherAssignedItem): string | null {
  if (isOnboardingItem(student)) {
    return null;
  }

  const directId = student.groupId ?? null;
  const nestedId = student.group?.id ?? null;

  if (directId && nestedId && directId !== nestedId) {
    return null;
  }

  return directId ?? nestedId;
}

/** Only active, enrolled students with a valid group assignment belong on the roster. */
export function isActiveAttendanceStudent(student: TeacherAssignedItem): boolean {
  if (isOnboardingItem(student)) {
    return false;
  }
  if (student.user.status !== 'ACTIVE') {
    return false;
  }
  if (student.status && student.status !== 'ACTIVE') {
    return false;
  }
  return resolveStudentGroupId(student) !== null;
}

/** Active students strictly assigned to a single group (deduplicated). */
export function resolveGroupStudents(
  students: TeacherAssignedItem[],
  groupId: string,
): TeacherAssignedItem[] {
  const seen = new Set<string>();
  const roster: TeacherAssignedItem[] = [];

  for (const student of students) {
    if (!isActiveAttendanceStudent(student)) continue;
    if (resolveStudentGroupId(student) !== groupId) continue;

    const key = getItemId(student);
    if (seen.has(key)) continue;
    seen.add(key);
    roster.push(student);
  }

  return roster;
}

export function buildStudentsByGroup(
  students: TeacherAssignedItem[],
  groupIds: readonly string[],
): Record<string, TeacherAssignedItem[]> {
  const map: Record<string, TeacherAssignedItem[]> = {};
  for (const groupId of groupIds) {
    map[groupId] = resolveGroupStudents(students, groupId);
  }
  return map;
}

export function countGroupStudents(
  students: TeacherAssignedItem[],
  groupId: string,
): number {
  return resolveGroupStudents(students, groupId).length;
}

export function mergeGroupRosterStudents(
  studentsByGroup: Record<string, TeacherAssignedItem[]>,
  groupIds: readonly string[],
): TeacherAssignedItem[] {
  const seen = new Set<string>();
  const roster: TeacherAssignedItem[] = [];

  for (const groupId of groupIds) {
    for (const student of studentsByGroup[groupId] ?? []) {
      const key = getItemId(student);
      if (seen.has(key)) continue;
      seen.add(key);
      roster.push(student);
    }
  }

  return roster;
}

/** Grid rows for one group: absence-filtered list intersected with the strict roster. */
export function filterGridStudentsForGroup(
  displayStudents: TeacherAssignedItem[],
  rosterStudents: TeacherAssignedItem[],
): TeacherAssignedItem[] {
  const rosterIds = new Set(rosterStudents.map(getItemId));
  return displayStudents.filter((student) => rosterIds.has(getItemId(student)));
}
