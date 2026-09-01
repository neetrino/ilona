import type { BlogPostDto } from '@ilona/types';

export type LatestNewsFormState = {
  titleEn: string;
  titleHy: string;
  bodyEn: string;
  bodyHy: string;
  publishedAt: string;
  isPublished: boolean;
};

export const EMPTY_LATEST_NEWS_FORM: LatestNewsFormState = {
  titleEn: '',
  titleHy: '',
  bodyEn: '',
  bodyHy: '',
  publishedAt: new Date().toISOString().slice(0, 10),
  isPublished: true,
};

export const LATEST_NEWS_MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const LATEST_NEWS_ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

export const latestNewsInputClassName =
  'h-11 min-h-11 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] px-4 py-0 text-sm text-[#3b3b40] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20';

export const latestNewsTextareaClassName =
  'w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] px-4 py-3 text-sm text-[#3b3b40] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20';

export function paragraphsToText(paragraphs: string[]): string {
  return paragraphs.join('\n\n');
}

export function textToParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function toLatestNewsFormState(post: BlogPostDto): LatestNewsFormState {
  return {
    titleEn: post.titleEn,
    titleHy: post.titleHy,
    bodyEn: paragraphsToText(post.bodyEn),
    bodyHy: paragraphsToText(post.bodyHy),
    publishedAt: post.publishedAt.slice(0, 10),
    isPublished: post.isPublished,
  };
}
