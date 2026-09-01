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

const BLOG_DATE_BADGE_STYLES: Record<string, { shell: string; text: string }> = {
  'text-[#1447e6]': {
    shell: 'bg-gradient-to-r from-[#e8efff] to-[#dbe7ff] ring-[#b8ccff]/80',
    text: 'text-[#1447e6]',
  },
  'text-[#008236]': {
    shell: 'bg-gradient-to-r from-[#e6f8ee] to-[#d4f3e1] ring-[#9ad9b5]/80',
    text: 'text-[#008236]',
  },
  'text-[#8200db]': {
    shell: 'bg-gradient-to-r from-[#f4e8ff] to-[#ead5ff] ring-[#d0a8f5]/80',
    text: 'text-[#8200db]',
  },
};

const DEFAULT_BLOG_DATE_BADGE = {
  shell: 'bg-gradient-to-r from-[#eef1ff] to-[#e4e9ff] ring-[#c5cdf8]/80',
  text: 'text-[#1010a3]',
};

/** Soft colorful chip styles for blog date badges on landing cards/pages. */
export function getBlogDateBadgeClasses(dateColor: string): { shell: string; text: string } {
  return BLOG_DATE_BADGE_STYLES[dateColor] ?? DEFAULT_BLOG_DATE_BADGE;
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
