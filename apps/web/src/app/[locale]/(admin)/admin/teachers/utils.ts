import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';

/**
 * Extract centers from teacher (from centers field or groups)
 */
export function getTeacherCenters(teacher: Teacher): Center[] {
  if (teacher.centers && teacher.centers.length > 0) {
    return teacher.centers as Center[];
  }
  
  return Array.from(
    new Map(
      (teacher.groups || [])
        .filter((group) => group.center)
        .map((group) => [group.center!.id, group.center!])
    ).values()
  ) as Center[];
}

/**
 * Filter teachers by branch IDs
 */
export function filterTeachersByBranches(
  teachers: Teacher[],
  selectedBranchIds: Set<string>
): Teacher[] {
  if (selectedBranchIds.size === 0) {
    return teachers;
  }

  return teachers.filter((teacher) => {
    const teacherCenters = getTeacherCenters(teacher);
    const teacherCenterIds = new Set(teacherCenters.map(c => c.id));
    return Array.from(selectedBranchIds).some(branchId => 
      teacherCenterIds.has(branchId)
    );
  });
}

/**
 * Group teachers by center for board view
 */
export function groupTeachersByCenter(
  teachers: Teacher[],
  centers: Center[],
  viewMode: 'list' | 'board'
): Record<string, Teacher[]> {
  if (viewMode !== 'board') return {};
  
  const grouped: Record<string, Teacher[]> = {};
  
  // Initialize all centers
  centers.forEach(center => {
    grouped[center.id] = [];
  });
  
  // Add unassigned teachers column
  grouped['unassigned'] = [];
  
  // Assign teachers to their centers
  teachers.forEach(teacher => {
    const teacherCenters = getTeacherCenters(teacher);
    
    if (teacherCenters.length > 0) {
      // Assign to first center (or could assign to all centers)
      const firstCenterId = teacherCenters[0].id;
      if (grouped[firstCenterId]) {
        grouped[firstCenterId].push(teacher);
      } else {
        grouped['unassigned'].push(teacher);
      }
    } else {
      grouped['unassigned'].push(teacher);
    }
  });
  
  return grouped;
}

/**
 * Format hourly rate as currency
 */
export function formatHourlyRate(rate: number | string | null | undefined): string {
  const numericRate = typeof rate === 'string' ? parseFloat(rate) : Number(rate || 0);
  return new Intl.NumberFormat('hy-AM', {
    style: 'currency',
    currency: 'AMD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericRate);
}

