/** Nav message keys returned by global search for `type: page` (see search-quick-pages metadata). */
export const GLOBAL_SEARCH_PAGE_NAV_KEYS = [
  'dashboard',
  'students',
  'teachers',
  'groups',
  'crm',
  'schedule',
  'calendar',
  'attendanceRegister',
  'recording',
  'settings',
  'chat',
  'finance',
  'analytics',
  'myStudents',
  'dailyPlan',
  'recordings',
  'payments',
  'myFeedbacks',
  'ourTeachers',
  'attendance',
] as const;

export type GlobalSearchPageNavKey = (typeof GLOBAL_SEARCH_PAGE_NAV_KEYS)[number];

export function isGlobalSearchPageNavKey(v: string): v is GlobalSearchPageNavKey {
  return (GLOBAL_SEARCH_PAGE_NAV_KEYS as readonly string[]).includes(v);
}
