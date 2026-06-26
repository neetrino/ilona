import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { UserRole } from '@/types';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';

type NavigateToPortalChatParams = {
  router: { push: (href: string) => void };
  locale: string;
  role: UserRole;
  pathname: string;
  searchParams: ReadonlyURLSearchParams;
};

export function getPortalChatPath(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
    case 'MANAGER':
      return `${getAdminPortalBasePath(role)}/chat`;
    case 'TEACHER':
      return '/teacher/chat';
    case 'STUDENT':
      return '/student/chat';
    default:
      return '/admin/chat';
  }
}

export function buildPortalChatHref(
  role: UserRole,
  params: { conversationId: string; returnTo?: string; tab?: string },
): string {
  const search = new URLSearchParams();
  search.set('conversationId', params.conversationId);
  if (params.tab) {
    search.set('tab', params.tab);
  }
  if (params.returnTo) {
    search.set('returnTo', params.returnTo);
  }
  return `${getPortalChatPath(role)}?${search.toString()}`;
}

export function navigateToPortalChat({
  router,
  role,
  pathname,
  searchParams,
}: NavigateToPortalChatParams): void {
  const currentPath = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  const returnTo = encodeURIComponent(currentPath);

  router.push(`${getPortalChatPath(role)}?returnTo=${returnTo}`);
}
