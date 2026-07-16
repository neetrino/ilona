import type { AdminStudentRecordingFilters } from './message.types';

export function normalizeStringArray(value?: string | string[]): string[] {
  if (value === undefined || value === null) return [];
  return (Array.isArray(value) ? value : [value]).filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  );
}

export function resolveAdminRecordingStudentIds(
  filters: AdminStudentRecordingFilters,
): string[] {
  return normalizeStringArray(
    filters.studentIds?.length
      ? filters.studentIds
      : filters.studentUserId
        ? [filters.studentUserId]
        : [],
  );
}

export function resolveAdminRecordingGroupIds(
  filters: AdminStudentRecordingFilters,
): string[] {
  return normalizeStringArray(
    filters.groupIds?.length ? filters.groupIds : filters.groupId ? [filters.groupId] : [],
  );
}

export function adminRecordingMatchesFilters(
  senderId: string,
  groupId: string | null,
  filters: AdminStudentRecordingFilters,
): boolean {
  const groupIds = resolveAdminRecordingGroupIds(filters);
  const studentIds = resolveAdminRecordingStudentIds(filters);

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

export function applyRecordingPagination<T>(
  items: T[],
  options?: { skip?: number; take?: number },
): T[] {
  const skip =
    typeof options?.skip === 'number' && Number.isFinite(options.skip) && options.skip > 0
      ? Math.floor(options.skip)
      : 0;
  const take =
    typeof options?.take === 'number' && Number.isFinite(options.take) && options.take > 0
      ? Math.floor(options.take)
      : null;

  if (take === null) {
    return skip > 0 ? items.slice(skip) : items;
  }
  return items.slice(skip, skip + take);
}
