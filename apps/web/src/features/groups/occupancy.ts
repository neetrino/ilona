export type GroupOccupancyStatus = 'full' | 'filling' | 'red';

export interface GroupOccupancyMeta {
  status: GroupOccupancyStatus;
  label: 'Full' | 'Filling' | 'Red';
}

/**
 * Centralized occupancy logic used everywhere group capacity is displayed.
 * Business thresholds:
 * - Full: 8+
 * - Filling: 5-7
 * - Red: 0-4
 */
export function getGroupOccupancyMeta(studentCount: number): GroupOccupancyMeta {
  if (studentCount >= 8) {
    return { status: 'full', label: 'Full' };
  }

  if (studentCount >= 5) {
    return { status: 'filling', label: 'Filling' };
  }

  return { status: 'red', label: 'Red' };
}
