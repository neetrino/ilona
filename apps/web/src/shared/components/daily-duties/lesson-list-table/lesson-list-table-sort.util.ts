import type { Lesson } from '@/features/lessons';

export function sortLessonListRows(
  lessons: Lesson[],
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
): Lesson[] {
  const sorted = [...lessons];

  if (sortBy === 'scheduledAt' && sortOrder) {
    sorted.sort((a, b) => {
      const aTime = new Date(a.scheduledAt).getTime();
      const bTime = new Date(b.scheduledAt).getTime();
      if (a.completionStatus === 'DONE' && b.completionStatus !== 'DONE') return 1;
      if (a.completionStatus !== 'DONE' && b.completionStatus === 'DONE') return -1;
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    });
  } else {
    sorted.sort((a, b) => {
      if (a.completionStatus === 'DONE' && b.completionStatus !== 'DONE') return 1;
      if (a.completionStatus !== 'DONE' && b.completionStatus === 'DONE') return -1;
      const aTime = new Date(a.scheduledAt).getTime();
      const bTime = new Date(b.scheduledAt).getTime();
      return bTime - aTime;
    });
  }

  return sorted;
}
