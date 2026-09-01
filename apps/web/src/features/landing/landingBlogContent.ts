import type { BlogPostDto } from '@ilona/types';
import { getFullApiUrl } from '@/shared/lib/api-url-utils';

export type LandingBlogPostView = {
  slug: string;
  image: string;
  dateColor: string;
  titleEn: string;
  titleHy: string;
  bodyEn: readonly string[];
  bodyHy: readonly string[];
  imageClassName?: string;
  publishedAt: string;
};

export function formatLandingBlogDate(isoDate: string, isHy: boolean): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat(isHy ? 'hy-AM' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Seeded Figma posts store a base `imageUrl` plus an opaque `overlayUrl`.
 * The overlay is the real cover visitors should see; admin "Cover image" must match.
 */
export function getBlogPostCoverUrl(post: Pick<BlogPostDto, 'imageUrl' | 'overlayUrl'>): string {
  return post.overlayUrl ?? post.imageUrl;
}

export function mapBlogPostToLandingView(post: BlogPostDto): LandingBlogPostView {
  const coverUrl = getBlogPostCoverUrl(post);
  const image = getFullApiUrl(coverUrl) ?? coverUrl;

  return {
    slug: post.slug,
    image,
    dateColor: post.dateColor,
    titleEn: post.titleEn,
    titleHy: post.titleHy,
    bodyEn: post.bodyEn,
    bodyHy: post.bodyHy,
    imageClassName: post.imageClassName ?? undefined,
    publishedAt: post.publishedAt,
  };
}
