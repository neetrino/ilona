export const STORAGE_KEY_PREFIXES = ['avatars', 'chat', 'documents', 'settings', 'cv-applications'] as const;

export const PROXY_STORAGE_KEY_PREFIXES = ['chat', 'avatars', 'documents'] as const;

export class InvalidStorageKeyError extends Error {
  constructor(message = 'Invalid storage key') {
    super(message);
    this.name = 'InvalidStorageKeyError';
  }
}

export function assertSafeStorageKey(key: string): string {
  const normalized = key.replace(/\\/g, '/').replace(/^\/+/, '').trim();

  if (!normalized || normalized.includes('\0') || normalized.includes('..')) {
    throw new InvalidStorageKeyError();
  }

  const segments = normalized.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new InvalidStorageKeyError();
  }

  const root = segments[0];
  if (!STORAGE_KEY_PREFIXES.includes(root as (typeof STORAGE_KEY_PREFIXES)[number])) {
    throw new InvalidStorageKeyError();
  }

  return segments.join('/');
}

export function extractStorageKeyFromProxyUrl(decodedUrl: string): string {
  try {
    const url = new URL(decodedUrl);
    return assertSafeStorageKey(url.pathname.replace(/^\/+/, ''));
  } catch (error) {
    if (error instanceof InvalidStorageKeyError) {
      throw error;
    }
  }

  return extractStorageKeyFromProxyUrlFallback(decodedUrl);
}

function extractStorageKeyFromProxyUrlFallback(decodedUrl: string): string {
  for (const prefix of PROXY_STORAGE_KEY_PREFIXES) {
    const nestedMarker = `/${prefix}/`;
    const nestedIndex = decodedUrl.lastIndexOf(nestedMarker);
    if (nestedIndex !== -1) {
      return assertSafeStorageKey(decodedUrl.slice(nestedIndex + 1));
    }

    const bareMarker = `/${prefix}`;
    if (decodedUrl.endsWith(bareMarker)) {
      return assertSafeStorageKey(prefix);
    }
  }

  throw new InvalidStorageKeyError('Invalid file URL format');
}
