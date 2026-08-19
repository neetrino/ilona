import type { UserRole } from '@/types';

const LOCALE_PATH_PREFIX = /^\/[a-z]{2}(?=\/)/;
const ADMIN_BASE_PATH = '/admin';
const MANAGER_BASE_PATH = '/manager';
const ADMIN_ONLY_PREFIXES = ['/finance', '/recording'] as const;

/** Strips `/en`, `/hy`, etc. only when followed by `/` — safe for `/admin/...` paths without locale. */
export function stripLocaleFromPath(path: string): string {
  return path.replace(LOCALE_PATH_PREFIX, '') || path;
}

/** Tailwind `lg` — docked sidebar and desktop admin entry from this width up. */
export const PORTAL_DESKTOP_MIN_WIDTH = 1024;

/** Tailwind `tablet` — right-side sheets from this width (all iPads: mini / Air / Pro). */
export const PORTAL_SIDE_SHEET_MIN_WIDTH = 744;

export function getAdminPortalBasePath(role?: UserRole | null): '/admin' | '/manager' {
  return role === 'MANAGER' ? MANAGER_BASE_PATH : ADMIN_BASE_PATH;
}

export function toRolePortalPath(path: string, role?: UserRole | null): string {
  if (!path.startsWith(ADMIN_BASE_PATH)) {
    return path;
  }

  const basePath = getAdminPortalBasePath(role);
  return path.replace(ADMIN_BASE_PATH, basePath);
}

export function isAdminPortalPath(path: string): boolean {
  return path.startsWith(ADMIN_BASE_PATH) || path.startsWith(MANAGER_BASE_PATH);
}

export function isAdminPortalRootPath(path: string): boolean {
  const normalized = stripLocaleFromPath(path);
  return normalized === ADMIN_BASE_PATH || normalized === MANAGER_BASE_PATH;
}

export function isAdminPortalSubpage(path: string, role?: UserRole | null): boolean {
  if (!isAdminPortalPath(path)) {
    return false;
  }

  const normalized = stripLocaleFromPath(path);
  return normalized !== getAdminPortalBasePath(role);
}

export function isTeacherPortalRootPath(path: string): boolean {
  const normalized = stripLocaleFromPath(path);
  return normalized === '/teacher';
}

export function isStudentPortalRootPath(path: string): boolean {
  const normalized = stripLocaleFromPath(path);
  return normalized === '/student';
}

export function isTeacherPortalSubpage(path: string): boolean {
  const normalized = stripLocaleFromPath(path);
  return normalized.startsWith('/teacher') && !isTeacherPortalRootPath(path);
}

export function isStudentPortalSubpage(path: string): boolean {
  const normalized = stripLocaleFromPath(path);
  return normalized.startsWith('/student') && !isStudentPortalRootPath(path);
}

export function isStudentProfilePath(path: string): boolean {
  return stripLocaleFromPath(path) === '/student/profile';
}

export function isTeacherProfilePath(path: string): boolean {
  return stripLocaleFromPath(path) === '/teacher/profile';
}

export function getTeacherPortalHomePath(): string {
  return '/teacher';
}

export const TEACHER_DAILY_DUTIES_BASE_PATH = '/teacher/daily-duties';
export const ADMIN_DAILY_DUTIES_BASE_PATH = '/admin/daily-duties';
export const MANAGER_DAILY_DUTIES_BASE_PATH = '/manager/daily-duties';

export function getAdminDailyDutiesBasePath(role?: UserRole | null): typeof ADMIN_DAILY_DUTIES_BASE_PATH | typeof MANAGER_DAILY_DUTIES_BASE_PATH {
  return role === 'MANAGER' ? MANAGER_DAILY_DUTIES_BASE_PATH : ADMIN_DAILY_DUTIES_BASE_PATH;
}

export function getTeacherDailyDutiesLessonPath(lessonId: string): string {
  return `${TEACHER_DAILY_DUTIES_BASE_PATH}/${lessonId}`;
}

export function getAdminDailyDutiesLessonPath(lessonId: string, role?: UserRole | null): string {
  return `${getAdminDailyDutiesBasePath(role)}/${lessonId}`;
}

export function getStudentPortalHomePath(): string {
  return '/student';
}

export function isPortalMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia(`(min-width: ${PORTAL_DESKTOP_MIN_WIDTH}px)`).matches;
}

export function isAdminOnlyPathForManager(path: string): boolean {
  if (!path.startsWith(ADMIN_BASE_PATH) && !path.startsWith(MANAGER_BASE_PATH)) {
    return false;
  }

  const normalized = path.startsWith(MANAGER_BASE_PATH)
    ? path.replace(MANAGER_BASE_PATH, '')
    : path.replace(ADMIN_BASE_PATH, '');

  return ADMIN_ONLY_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}
