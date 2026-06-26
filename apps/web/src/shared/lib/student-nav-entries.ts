import type { StudentSidebarIconKey } from '@/features/student-dashboard/studentSidebarAssets';

export type StudentNavEntry = {
  labelKey: string;
  href: string;
  icon: StudentSidebarIconKey;
};

export function getStudentNavEntries(): StudentNavEntry[] {
  return [
    { labelKey: 'dashboard', href: '/student/dashboard', icon: 'iconDashboard' },
    { labelKey: 'schedule', href: '/student/schedule', icon: 'iconSchedule' },
    { labelKey: 'recordings', href: '/student/recordings', icon: 'iconRecordings' },
    { labelKey: 'myFeedbacks', href: '/student/my-feedbacks', icon: 'iconFeedbacks' },
    { labelKey: 'ourTeachers', href: '/student/our-teachers', icon: 'iconTeachers' },
    { labelKey: 'payments', href: '/student/payments', icon: 'iconPayments' },
    { labelKey: 'analytics', href: '/student/analytics', icon: 'iconAnalytics' },
    { labelKey: 'attendance', href: '/student/attendance', icon: 'iconAttendance' },
    { labelKey: 'settings', href: '/student/settings', icon: 'iconSettings' },
  ];
}
