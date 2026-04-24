import { UserRole } from '@ilona/database';
import { normalizeSearchQuery } from './search-query.util';
import type { GlobalSearchResult } from './types/search-result.type';

type QuickPageRow = {
  id: string;
  href: string;
  navKey: string;
  titleEn: string;
  roles: UserRole[];
  synonyms: string[];
};

const ROWS: QuickPageRow[] = [
  {
    id: 'page-admin-dashboard',
    href: '/admin/dashboard',
    navKey: 'dashboard',
    titleEn: 'Dashboard',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['home', 'overview'],
  },
  {
    id: 'page-admin-students',
    href: '/admin/students',
    navKey: 'students',
    titleEn: 'Students',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['learners', 'pupils'],
  },
  {
    id: 'page-admin-teachers',
    href: '/admin/teachers',
    navKey: 'teachers',
    titleEn: 'Teachers',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['staff', 'instructors'],
  },
  {
    id: 'page-admin-groups',
    href: '/admin/groups',
    navKey: 'groups',
    titleEn: 'Groups / Center',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['classes', 'branches', 'centers'],
  },
  {
    id: 'page-admin-crm',
    href: '/admin/crm',
    navKey: 'crm',
    titleEn: 'CRM',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['leads', 'pipeline', 'sales'],
  },
  {
    id: 'page-admin-schedule',
    href: '/admin/schedule',
    navKey: 'schedule',
    titleEn: 'Schedule',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['timetable'],
  },
  {
    id: 'page-admin-calendar',
    href: '/admin/calendar',
    navKey: 'calendar',
    titleEn: 'Calendar',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['lessons', 'classes'],
  },
  {
    id: 'page-admin-attendance-register',
    href: '/admin/attendance-register',
    navKey: 'attendanceRegister',
    titleEn: 'Attendance register',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['attendance', 'register'],
  },
  {
    id: 'page-admin-recording',
    href: '/admin/recording',
    navKey: 'recording',
    titleEn: 'Recordings',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['recordings', 'audio', 'voice'],
  },
  {
    id: 'page-admin-settings',
    href: '/admin/settings',
    navKey: 'settings',
    titleEn: 'Settings',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['config', 'preferences'],
  },
  {
    id: 'page-admin-chat',
    href: '/admin/chat',
    navKey: 'chat',
    titleEn: 'Chat',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['messages', 'support'],
  },
  {
    id: 'page-admin-finance',
    href: '/admin/finance',
    navKey: 'finance',
    titleEn: 'Finance',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    synonyms: ['payments', 'money', 'billing'],
  },
  {
    id: 'page-admin-analytics',
    href: '/admin/analytics',
    navKey: 'analytics',
    titleEn: 'Analytics',
    roles: [UserRole.ADMIN],
    synonyms: ['reports', 'stats', 'insights'],
  },
  {
    id: 'page-teacher-dashboard',
    href: '/teacher/dashboard',
    navKey: 'dashboard',
    titleEn: 'Dashboard',
    roles: [UserRole.TEACHER],
    synonyms: ['home', 'overview'],
  },
  {
    id: 'page-teacher-students',
    href: '/teacher/students',
    navKey: 'myStudents',
    titleEn: 'My students',
    roles: [UserRole.TEACHER],
    synonyms: ['students', 'learners', 'class'],
  },
  {
    id: 'page-teacher-schedule',
    href: '/teacher/schedule',
    navKey: 'schedule',
    titleEn: 'Schedule',
    roles: [UserRole.TEACHER],
    synonyms: ['timetable'],
  },
  {
    id: 'page-teacher-calendar',
    href: '/teacher/calendar',
    navKey: 'calendar',
    titleEn: 'Calendar',
    roles: [UserRole.TEACHER],
    synonyms: ['lessons'],
  },
  {
    id: 'page-teacher-daily-plan',
    href: '/teacher/daily-plan',
    navKey: 'dailyPlan',
    titleEn: 'Daily plan',
    roles: [UserRole.TEACHER],
    synonyms: ['plan', 'lesson plan'],
  },
  {
    id: 'page-teacher-attendance-register',
    href: '/teacher/attendance-register',
    navKey: 'attendanceRegister',
    titleEn: 'Attendance register',
    roles: [UserRole.TEACHER],
    synonyms: ['attendance', 'register'],
  },
  {
    id: 'page-teacher-recordings',
    href: '/teacher/recordings',
    navKey: 'recordings',
    titleEn: 'Recordings',
    roles: [UserRole.TEACHER],
    synonyms: ['audio', 'voice'],
  },
  {
    id: 'page-teacher-chat',
    href: '/teacher/chat',
    navKey: 'chat',
    titleEn: 'Chat',
    roles: [UserRole.TEACHER],
    synonyms: ['messages'],
  },
  {
    id: 'page-teacher-settings',
    href: '/teacher/settings',
    navKey: 'settings',
    titleEn: 'Settings',
    roles: [UserRole.TEACHER],
    synonyms: ['preferences'],
  },
  {
    id: 'page-student-dashboard',
    href: '/student/dashboard',
    navKey: 'dashboard',
    titleEn: 'Dashboard',
    roles: [UserRole.STUDENT],
    synonyms: ['home'],
  },
  {
    id: 'page-student-payments',
    href: '/student/payments',
    navKey: 'payments',
    titleEn: 'Payments',
    roles: [UserRole.STUDENT],
    synonyms: ['billing', 'tuition', 'invoice'],
  },
  {
    id: 'page-student-attendance',
    href: '/student/attendance',
    navKey: 'attendance',
    titleEn: 'Attendance',
    roles: [UserRole.STUDENT],
    synonyms: ['absence', 'presence'],
  },
  {
    id: 'page-student-recordings',
    href: '/student/recordings',
    navKey: 'recordings',
    titleEn: 'Recordings',
    roles: [UserRole.STUDENT],
    synonyms: ['audio', 'voice'],
  },
  {
    id: 'page-student-chat',
    href: '/student/chat',
    navKey: 'chat',
    titleEn: 'Chat',
    roles: [UserRole.STUDENT],
    synonyms: ['messages'],
  },
  {
    id: 'page-student-our-teachers',
    href: '/student/our-teachers',
    navKey: 'ourTeachers',
    titleEn: 'Our teachers',
    roles: [UserRole.STUDENT],
    synonyms: ['teachers', 'staff'],
  },
  {
    id: 'page-student-settings',
    href: '/student/settings',
    navKey: 'settings',
    titleEn: 'Settings',
    roles: [UserRole.STUDENT],
    synonyms: ['preferences'],
  },
];

function rowMatches(row: QuickPageRow, needleLower: string): boolean {
  const parts = [row.navKey, row.titleEn, ...row.synonyms, row.href.replace(/\//g, ' ')].map((s) =>
    normalizeSearchQuery(s).toLowerCase(),
  );
  return parts.some((p) => p.includes(needleLower));
}

export function matchQuickPages(role: UserRole, query: string, take: number): GlobalSearchResult[] {
  const needle = normalizeSearchQuery(query).toLowerCase();
  if (needle.length < 2) {
    return [];
  }
  return ROWS.filter((row) => row.roles.includes(role) && rowMatches(row, needle))
    .slice(0, take)
    .map((row) => ({
      id: row.id,
      type: 'page' as const,
      title: row.titleEn,
      subtitle: 'Quick navigation',
      href: row.href,
      badge: 'Page',
      metadata: { navKey: row.navKey },
    }));
}
