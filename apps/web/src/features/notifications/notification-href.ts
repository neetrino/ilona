import type { PortalNotification } from '@ilona/types';
import type { UserRole } from '@/types';
import { toRolePortalPath } from '@/shared/lib/role-routes';

export function notificationHref(
  item: PortalNotification,
  locale: string,
  role?: UserRole | null,
): string | null {
  const raw = item.data?.href;
  if (!raw) {
    return null;
  }
  const path = toRolePortalPath(raw, role);
  return `/${locale}${path}`;
}
