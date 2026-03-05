import type { Student, TeacherAssignedItem } from '@/features/students';
import type { Center } from '@ilona/types';

/**
 * Group students by center for board view
 */
export function groupStudentsByCenter(
  students: TeacherAssignedItem[],
  centers: Center[],
  viewMode: 'list' | 'board'
): Record<string, TeacherAssignedItem[]> {
  if (viewMode !== 'board') return {};
  
  const grouped: Record<string, TeacherAssignedItem[]> = {};
  
  // Initialize all centers
  centers.forEach(center => {
    grouped[center.id] = [];
  });
  
  // Add unassigned students column
  grouped['unassigned'] = [];
  
  // Assign students to their centers
  students.forEach(student => {
    const centerId = student.group?.center?.id;
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
  const studentsWithGroup = students.filter(s => s.group).length;
  
  return {
    activeStudents,
    studentsWithGroup,
  };
}







