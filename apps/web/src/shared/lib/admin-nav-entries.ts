import { toRolePortalPath } from '@/shared/lib/role-routes';
import type { StudentSidebarIconKey } from '@/features/student-dashboard/studentSidebarAssets';

export type AdminNavIcon =
  | { type: 'sidebar'; icon: StudentSidebarIconKey }
  | { type: 'image'; src: string; width?: number; height?: number }
  | { type: 'svg'; paths: string };

export type AdminNavEntry = {
  labelKey: string;
  href: string;
  icon: AdminNavIcon;
};

export function getAdminNavEntries(role: string): AdminNavEntry[] {
  const core: AdminNavEntry[] = [
    { labelKey: 'dashboard', href: '/admin/dashboard', icon: { type: 'sidebar', icon: 'iconDashboard' } },
    { labelKey: 'crm', href: '/admin/crm', icon: { type: 'sidebar', icon: 'iconCrm' } },
    { labelKey: 'groups', href: '/admin/groups', icon: { type: 'sidebar', icon: 'iconGroups' } },
    { labelKey: 'teachers', href: '/admin/teachers', icon: { type: 'sidebar', icon: 'iconTeachers' } },
    { labelKey: 'students', href: '/admin/students', icon: { type: 'sidebar', icon: 'iconStudents' } },
    { labelKey: 'schedule', href: '/admin/schedule', icon: { type: 'sidebar', icon: 'iconSchedule' } },
    { labelKey: 'dailyPlan', href: '/admin/daily-plan', icon: { type: 'sidebar', icon: 'iconFeedbacks' } },
  ];

  const tail: AdminNavEntry[] = [
    { labelKey: 'calendar', href: '/admin/calendar', icon: { type: 'sidebar', icon: 'iconCalendar' } },
    {
      labelKey: 'attendanceRegister',
      href: '/admin/attendance-register',
      icon: { type: 'sidebar', icon: 'iconAttendance' },
    },
    { labelKey: 'settings', href: '/admin/settings', icon: { type: 'sidebar', icon: 'iconSettings' } },
  ];

  if (role === 'MANAGER') {
    return [...core, ...tail].map((item) => ({
      ...item,
      href: toRolePortalPath(item.href, 'MANAGER'),
    }));
  }

  return [
    ...core,
    { labelKey: 'recordings', href: '/admin/recording', icon: { type: 'sidebar', icon: 'iconRecordings' } },
    { labelKey: 'finance', href: '/admin/finance', icon: { type: 'sidebar', icon: 'iconPayments' } },
    ...tail.slice(0, 2),
    { labelKey: 'analytics', href: '/admin/analytics', icon: { type: 'sidebar', icon: 'iconAnalytics' } },
    tail[2],
  ];
}
