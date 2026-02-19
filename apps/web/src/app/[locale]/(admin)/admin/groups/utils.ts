import type { Group } from '@/features/groups';
import type { Center } from '@ilona/types';

/**
 * Group groups by center for board view
 */
export function groupGroupsByCenter(
  groups: Group[],
  centers: Center[],
  viewMode: 'list' | 'board'
): Record<string, Group[]> {
  if (viewMode !== 'board') return {};
  
  const grouped: Record<string, Group[]> = {};
  
  // Initialize all centers
  centers.forEach(center => {
    grouped[center.id] = [];
  });
  
  // Assign groups to their centers
  groups.forEach(group => {
    if (!grouped[group.centerId]) {
      grouped[group.centerId] = [];
    }
    grouped[group.centerId].push(group);
  });
  
  return grouped;
}

/**
 * Calculate group statistics
 */
export function calculateGroupStats(groups: Group[]) {
  const activeGroups = groups.filter(g => g.isActive).length;
  const totalStudentsInGroups = groups.reduce((sum, g) => sum + (g._count?.students || 0), 0);
  const averageGroupSize = groups.length > 0 
    ? Math.round(totalStudentsInGroups / groups.length) 
    : 0;
  
  return {
    activeGroups,
    totalStudentsInGroups,
    averageGroupSize,
  };
}




