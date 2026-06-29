import type { AdminStudentRecordingFilters } from './message.types';

export function normalizeStringArray(value?: string | string[]): string[] {
  if (value === undefined || value === null) return [];
  return (Array.isArray(value) ? value : [value]).filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  );
}

export function adminRecordingMatchesFilters(
  senderId: string,
  groupId: string | null,
  filters: AdminStudentRecordingFilters,
): boolean {
  const groupIds = normalizeStringArray(
    filters.groupIds?.length ? filters.groupIds : filters.groupId ? [filters.groupId] : [],
  );
  const studentIds = normalizeStringArray(
    filters.studentIds?.length
      ? filters.studentIds
      : filters.studentUserId
        ? [filters.studentUserId]
        : [],
  );

  const hasGroups = groupIds.length > 0;
  const hasStudents = studentIds.length > 0;

  if (!hasGroups && !hasStudents) return true;

  const matchesGroup = (): boolean =>
    groupIds.some((gid) => {
      if (gid === 'ungrouped') return groupId === null;
      return groupId === gid;
    });

  const matchesStudent = (): boolean => studentIds.includes(senderId);

  if (hasGroups && hasStudents) return matchesGroup() || matchesStudent();
  if (hasGroups) return matchesGroup();
  return matchesStudent();
}
