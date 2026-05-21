/** Local sidebar assets from Figma — do not use remote URLs */
export const STUDENT_SIDEBAR_ASSETS = {
  brandLogo: '/student-sidebar/brand-logo.png',
  iconDashboard: '/student-sidebar/icon-dashboard.svg',
  iconSchedule: '/student-sidebar/icon-schedule.svg',
  iconRecordings: '/student-sidebar/icon-recordings.svg',
  iconFeedbacks: '/student-sidebar/icon-feedbacks.svg',
  iconTeachers: '/student-sidebar/icon-teachers.svg',
  iconPayments: '/student-sidebar/icon-payments.svg',
  iconAnalytics: '/student-sidebar/icon-analytics.svg',
  iconAttendance: '/student-sidebar/icon-attendance.svg',
  iconSettings: '/student-sidebar/icon-settings.svg',
} as const;

export type StudentSidebarIconKey = keyof Omit<typeof STUDENT_SIDEBAR_ASSETS, 'brandLogo'>;

export function getSidebarIconSrc(icon: StudentSidebarIconKey, _active: boolean): string {
  return STUDENT_SIDEBAR_ASSETS[icon];
}
