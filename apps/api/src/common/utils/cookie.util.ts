/**
 * Parse cookie header string into an object
 * @param cookieHeader - Cookie header string from request
 * @returns Object with cookie names as keys and values as values
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const [key, value] = pair.trim().split('=');
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
  }

  return cookies;
}

