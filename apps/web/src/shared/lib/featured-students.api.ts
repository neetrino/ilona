import { getApiBaseUrl } from '@/shared/lib/api-config';
import { ApiError } from '@/shared/lib/api-errors';

export type FeaturedStudentAvatar = {
  id: string;
  avatarUrl: string | null;
  initials: string;
};

type FeaturedAvatarsResponse = { items: FeaturedStudentAvatar[] };

/**
 * Public endpoint (no auth). Used on the marketing home bento.
 */
export async function fetchFeaturedStudentAvatars(
  limit = 4
): Promise<FeaturedAvatarsResponse> {
  const base = getApiBaseUrl();
  const url = `${base}/students/featured-avatars?limit=${encodeURIComponent(
    String(limit)
  )}`;
  const res = await fetch(url, { credentials: 'omit' });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError('Invalid response from server', res.status);
  }
  if (!res.ok) {
    const msg = (data as { message?: string | string[] }).message;
    const m = Array.isArray(msg) ? msg[0] : msg;
    throw new ApiError(
      typeof m === 'string' ? m : 'Request failed',
      res.status
    );
  }
  return data as FeaturedAvatarsResponse;
}
