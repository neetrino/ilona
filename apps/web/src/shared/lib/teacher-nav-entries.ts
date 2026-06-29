import type { StudentSidebarIconKey } from '@/features/student-dashboard/studentSidebarAssets';

export type TeacherNavEntry = {
  labelKey: string;
  href: string;
  icon: StudentSidebarIconKey;
};

export function getTeacherNavEntries(): TeacherNavEntry[] {
  return [
    { labelKey: 'dashboard', href: '/teacher/dashboard', icon: 'iconDashboard' },
    { labelKey: 'myStudents', href: '/teacher/students', icon: 'iconTeachers' },
    { labelKey: 'schedule', href: '/teacher/schedule', icon: 'iconSchedule' },
    { labelKey: 'dailyDuties', href: '/teacher/daily-duties', icon: 'iconCalendar' },
    { labelKey: 'dailyPlan', href: '/teacher/daily-plan', icon: 'iconFeedbacks' },
    { labelKey: 'recordings', href: '/teacher/recordings', icon: 'iconRecordings' },
    { labelKey: 'attendanceRegister', href: '/teacher/attendance-register', icon: 'iconAttendance' },
    { labelKey: 'salary', href: '/teacher/salary', icon: 'iconPayments' },
    { labelKey: 'analytics', href: '/teacher/analytics', icon: 'iconAnalytics' },
    { labelKey: 'settings', href: '/teacher/settings', icon: 'iconSettings' },
  ];
}
