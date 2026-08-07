import type { Group } from '@/features/groups';

export type GroupAssignmentOption = Pick<
  Group,
  'id' | 'name' | 'level' | 'teacherId' | 'centerId' | 'center'
>;

/** Active groups for a center (level is independent of assignment). */
export function filterGroupsByCenter(
  groups: GroupAssignmentOption[],
  centerId: string | undefined,
): GroupAssignmentOption[] {
  if (!centerId) return [];
  return groups.filter((g) => g.centerId === centerId);
}

/** Groups eligible for student assignment (must have a primary teacher). */
export function filterAssignableGroupsByCenter(
  groups: GroupAssignmentOption[],
  centerId: string | undefined,
): GroupAssignmentOption[] {
  return filterGroupsByCenter(groups, centerId).filter((g) => Boolean(g.teacherId));
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
