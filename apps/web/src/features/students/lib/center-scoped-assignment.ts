import type { Group } from '@/features/groups';

/**
 * Whether a teacher is associated with a center via explicit links or active groups.
 */
export function teacherBelongsToCenter(
  teacherId: string,
  centerId: string,
  centerLinks: Array<{ center: { id: string } }> | undefined,
  groups: Pick<Group, 'teacherId' | 'centerId'>[],
): boolean {
  if (centerLinks?.some((l) => l.center.id === centerId)) {
    return true;
  }
  return groups.some((g) => g.teacherId === teacherId && g.centerId === centerId);
}
