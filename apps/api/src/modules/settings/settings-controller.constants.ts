export const MAX_LOGO_SIZE = 5 * 1024 * 1024;

export const MAX_DASHBOARD_BANNER_SIZE = 5 * 1024 * 1024;

export const LOGO_TYPES = /^image\/(png|jpeg|jpg|webp|svg(\+xml)?)$/i;

export const DASHBOARD_BANNER_TYPES = /^image\/(png|jpeg|jpg|webp|svg(\+xml)?)$/i;

export const IMAGE_CONTENT_TYPE_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};
