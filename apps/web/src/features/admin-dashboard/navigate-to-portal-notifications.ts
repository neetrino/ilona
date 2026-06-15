import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { UserRole } from '@/types';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';

type NavigateToPortalNotificationsParams = {
  router: { push: (href: string) => void };
  locale: string;
  role: UserRole;
  pathname: string;
  searchParams: ReadonlyURLSearchParams;
};

export function navigateToPortalNotifications({
  router,
  locale,
  role,
  pathname,
  searchParams,
}: NavigateToPortalNotificationsParams): void {
  const currentPath = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  const returnTo = encodeURIComponent(currentPath);

  const roleSegment =
    role === 'ADMIN' || role === 'MANAGER'
      ? getAdminPortalBasePath(role).slice(1)
      : role.toLowerCase();

  router.push(`/${locale}/${roleSegment}/notifications?returnTo=${returnTo}`);
}
