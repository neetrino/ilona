'use client';

import { useEffect } from 'react';
import { getApiBaseUrl } from '@/shared/lib/api-config';

/**
 * Fires a single GET /api/warmup request as early as possible after the app mounts.
 * This preloads server-side resources (DB connection, middleware) so subsequent
 * requests (e.g. attendance, settings) are faster. No business logic; fire-and-forget.
 */
export function WarmupRequest() {
  useEffect(() => {
    const url = `${getApiBaseUrl()}/warmup`;
    fetch(url, { method: 'GET', keepalive: true }).catch(() => {
      // Ignore errors (e.g. offline, CORS) — warmup is best-effort
    });
  }, []);
  return null;
}
