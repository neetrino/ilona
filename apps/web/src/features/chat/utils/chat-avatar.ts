import { getFullApiUrl } from '@/shared/lib/api-url-utils';

/**
 * Admin users often have no personal avatar; show the centre brand logo instead
 * (same image as the portal sidebar).
 */
export function resolveChatAvatarUrl(
  avatarUrl: string | null | undefined,
  role: string | null | undefined,
  brandLogoUrl: string | null | undefined,
): string | null {
  const personal = getFullApiUrl(avatarUrl) ?? (avatarUrl?.trim() ? avatarUrl : null);
  if (personal) return personal;

  if (role === 'ADMIN' && brandLogoUrl) {
    return getFullApiUrl(brandLogoUrl) ?? brandLogoUrl;
  }

  return null;
}
