import { BLOG_DATE_COLORS } from '@ilona/types';

const MAX_BLOG_IMAGE_SIZE = 5 * 1024 * 1024;
const BLOG_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

export { MAX_BLOG_IMAGE_SIZE, BLOG_IMAGE_MIME, BLOG_DATE_COLORS };

export function slugifyBlogTitle(title: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return base || `post-${Date.now()}`;
}

export function parseBodyJson(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function toStorageFileUrl(key: string): string {
  return `/api/storage/file/${encodeURIComponent(key)}`;
}

export function pickDateColor(index: number): string {
  return BLOG_DATE_COLORS[index % BLOG_DATE_COLORS.length] ?? BLOG_DATE_COLORS[0];
}

/** Multipart/form-data sends booleans as strings; avoid Boolean("false") === true. */
export function parseFormBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return undefined;
}
