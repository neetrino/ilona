/**
 * API Configuration
 * Handles API URL resolution from environment or current host
 */

// Get API URL from environment or construct from current host
function getApiUrl(): string {
  // If explicitly set in environment, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In browser, construct from current host
  if (typeof window !== 'undefined') {
    const host = window.location.host;
    const protocol = window.location.protocol;
    // If running on port 3000, assume API is on 4000
    // Otherwise, use same host and port
    if (host.includes(':3000')) {
      return `${protocol}//${host.split(':')[0]}:4000/api`;
    }
    // For production or custom ports, try same host with /api
    return `${protocol}//${host}/api`;
  }

  // Server-side fallback
  return 'http://localhost:4000/api';
}

export const API_URL = getApiUrl();

/**
 * Get API base URL (exported for use in components)
 * Returns the base URL for API requests (e.g., "http://localhost:4000/api")
 */
export function getApiBaseUrl(): string {
  return API_URL;
}

