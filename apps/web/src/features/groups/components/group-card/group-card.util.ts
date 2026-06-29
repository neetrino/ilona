import type { GroupScheduleEntry } from '../../types';
import { getGroupOccupancyMeta } from '../../occupancy';
import { DAY_LABELS } from './group-card.constants';

export function formatScheduleSummary(
  entries: GroupScheduleEntry[] | null | undefined,
): string[] | null {
  if (!entries || entries.length === 0) return null;
  return entries
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
    .map((e) => `${DAY_LABELS[e.dayOfWeek] ?? 'Unknown day'}: ${e.startTime} - ${e.endTime}`);
}

export function getOccupancyDotClass(
  status: ReturnType<typeof getGroupOccupancyMeta>['status'],
): string {
  if (status === 'full') return 'bg-green-500';
  if (status === 'filling') return 'bg-orange-500';
  return 'bg-red-500';
}
