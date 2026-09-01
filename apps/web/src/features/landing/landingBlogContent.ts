import type { BlogPostDto } from '@ilona/types';
import { getFullApiUrl } from '@/shared/lib/api-url-utils';

export type LandingBlogPostView = {
  slug: string;
  image: string;
  overlay: string | null;
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

export function mapBlogPostToLandingView(post: BlogPostDto): LandingBlogPostView {
  const image = getFullApiUrl(post.imageUrl) ?? post.imageUrl;
  const overlay = post.overlayUrl ? getFullApiUrl(post.overlayUrl) ?? post.overlayUrl : null;

  return {
    slug: post.slug,
    image,
    overlay,
    dateColor: post.dateColor,
    titleEn: post.titleEn,
    titleHy: post.titleHy,
    bodyEn: post.bodyEn,
    bodyHy: post.bodyHy,
    imageClassName: post.imageClassName ?? undefined,
    publishedAt: post.publishedAt,
  };
}
