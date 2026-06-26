import type { Group } from '@/features/groups';

export type GroupAssignmentOption = Pick<
  Group,
  'id' | 'name' | 'level' | 'teacherId' | 'centerId' | 'center'
>;

/** Active groups for a center; optionally narrowed by CRM level filter. */
export function filterGroupsByCenter(
  groups: GroupAssignmentOption[],
  centerId: string | undefined,
  levelId?: string,
): GroupAssignmentOption[] {
  if (!centerId) return [];
  let filtered = groups.filter((g) => g.centerId === centerId);
  if (levelId) {
    filtered = filtered.filter((g) => (g.level ?? '') === levelId);
  }
  return filtered;
}

/** Groups eligible for student assignment (must have a primary teacher). */
export function filterAssignableGroupsByCenter(
  groups: GroupAssignmentOption[],
  centerId: string | undefined,
  levelId?: string,
): GroupAssignmentOption[] {
  return filterGroupsByCenter(groups, centerId, levelId).filter((g) =>
    Boolean(g.teacherId),
  );
}

export function resolveTeacherIdFromGroup(
  group: Pick<GroupAssignmentOption, 'teacherId'> | undefined,
): string | undefined {
  const id = group?.teacherId;
  return id && id.trim() !== '' ? id : undefined;
}

/** Keep the currently selected group visible when editing existing records. */
export function ensureCurrentGroupInList(
  groups: GroupAssignmentOption[],
  currentGroupId: string | undefined,
  allGroups: GroupAssignmentOption[],
): GroupAssignmentOption[] {
  if (!currentGroupId || groups.some((g) => g.id === currentGroupId)) {
    return groups;
  }
  const current = allGroups.find((g) => g.id === currentGroupId);
  return current ? [current, ...groups] : groups;
}
