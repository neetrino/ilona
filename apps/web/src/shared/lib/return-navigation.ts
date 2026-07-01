export function resolveReturnToPath(returnTo: string | null): string | null {
  if (!returnTo) {
    return null;
  }
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return null;
  }
  try {
    const testUrl = new URL(returnTo, window.location.origin);
    if (testUrl.origin === window.location.origin) {
      return returnTo;
    }
  } catch {
    return returnTo;
  }
  return null;
}

export function getCurrentReturnToPath(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return `${window.location.pathname}${window.location.search}`;
}
