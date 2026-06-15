import type { UserRole } from '@/types';

const ADMIN_BASE_PATH = '/admin';
const MANAGER_BASE_PATH = '/manager';
const ADMIN_ONLY_PREFIXES = ['/finance', '/analytics', '/recording'] as const;

/** Tailwind `lg` — docked sidebar and desktop admin entry from this width up. */
export const PORTAL_DESKTOP_MIN_WIDTH = 1024;

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
  const normalized = path.replace(/^\/[a-z]{2}/, '');
  return normalized === ADMIN_BASE_PATH || normalized === MANAGER_BASE_PATH;
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
