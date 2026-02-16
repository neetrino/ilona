/**
 * JWT utility functions for token decoding and expiration checking
 */

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Decode JWT token without verification (client-side only)
 * Returns null if token is invalid or cannot be decoded
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    // Base64 URL decode
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Check if JWT token is expired
 * Returns true if token is expired or invalid
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000;
  const now = Date.now();

  return now >= expirationTime;
}

/**
 * Get token expiration time in milliseconds
 * Returns null if token is invalid or has no expiration
 */
export function getTokenExpiration(token: string | null): number | null {
  if (!token) return null;

  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return null;

  return decoded.exp * 1000; // Convert to milliseconds
}

/**
 * Get time until token expires in milliseconds
 * Returns negative number if already expired, null if invalid
 */
export function getTimeUntilExpiration(token: string | null): number | null {
  const expiration = getTokenExpiration(token);
  if (expiration === null) return null;

  return expiration - Date.now();
}

/**
 * Check if token expires within the next N seconds
 * Useful for proactive refresh
 */
export function expiresWithin(token: string | null, seconds: number): boolean {
  const timeUntilExpiration = getTimeUntilExpiration(token);
  if (timeUntilExpiration === null) return true; // Treat invalid as expired

  return timeUntilExpiration <= seconds * 1000;
}

