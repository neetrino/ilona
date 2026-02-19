import type { Student } from '@/features/students';
import type { Center } from '@ilona/types';

/**
 * Group students by center for board view
 */
export function groupStudentsByCenter(
  students: Student[],
  centers: Center[],
  viewMode: 'list' | 'board'
): Record<string, Student[]> {
  if (viewMode !== 'board') return {};
  
  const grouped: Record<string, Student[]> = {};
  
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
 * Calculate student statistics
 */
export function calculateStudentStats(students: Student[]) {
  const activeStudents = students.filter(s => s.user?.status === 'ACTIVE').length;
  const studentsWithGroup = students.filter(s => s.group).length;
  
  return {
    activeStudents,
    studentsWithGroup,
  };
}




