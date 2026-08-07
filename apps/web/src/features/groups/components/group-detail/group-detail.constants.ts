export const GROUP_DETAIL_TABS = ['general', 'students', 'daily-plans'] as const;

export type GroupDetailTab = (typeof GROUP_DETAIL_TABS)[number];

export function isGroupDetailTab(value: string | null | undefined): value is GroupDetailTab {
  return value === 'general' || value === 'students' || value === 'daily-plans';
}

export const GROUP_DETAIL_STUDENTS_PAGE_SIZE = 10;
export const GROUP_DETAIL_DAILY_PLANS_TAKE = 50;
