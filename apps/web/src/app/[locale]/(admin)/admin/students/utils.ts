import type { Student, TeacherAssignedItem } from '@/features/students';
import { isOnboardingItem } from '@/features/students';
import type { Center } from '@ilona/types';

/**
 * Group students by center for board columns and list center strip.
 */
export function groupStudentsByCenter(
  students: TeacherAssignedItem[],
  centers: Array<Pick<Center, 'id'>>,
): Record<string, TeacherAssignedItem[]> {
  const grouped: Record<string, TeacherAssignedItem[]> = {};

  centers.forEach((center) => {
    grouped[center.id] = [];
  });

  grouped['unassigned'] = [];

  students.forEach((student) => {
    const centerId =
      !isOnboardingItem(student) && student.centerId
        ? student.centerId
        : student.group?.center?.id;
    if (centerId && grouped[centerId]) {
      grouped[centerId].push(student);
    } else {
      grouped['unassigned'].push(student);
    }
  });

  return grouped;
}

/**
 * Calculate student statistics (only full students have user/status)
 */
export function calculateStudentStats(students: TeacherAssignedItem[]) {
  const activeStudents = students.filter((s): s is Student => 'user' in s && s.user?.status === 'ACTIVE').length;
  const studentsWithGroup = students.filter((s) => s.group).length;

  return {
    activeStudents,
    studentsWithGroup,
  };
}
