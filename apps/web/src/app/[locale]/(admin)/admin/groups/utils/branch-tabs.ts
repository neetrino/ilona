/** URL `branch` value that shows every group (no branch filter). */
export const ALL_GROUPS_BRANCH = 'all';

export function isAllGroupsBranch(value: string | null | undefined): boolean {
  return value === ALL_GROUPS_BRANCH;
}
