import { Redis } from '@upstash/redis';
import {
  getUpstashRestToken,
  getUpstashRestUrl,
  isUpstashEnvConfigured,
} from './redis-env';

let client: Redis | null = null;

export function isUpstashConfigured(): boolean {
  return isUpstashEnvConfigured();
}

export function getUpstashRedis(): Redis {
  const url = getUpstashRestUrl();
  const token = getUpstashRestToken();

  if (!isUpstashEnvConfigured()) {
    throw new Error(
      'Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL (https://...) and UPSTASH_REDIS_REST_TOKEN.',
    );
  }

  if (!client) {
    client = new Redis({ url, token });
  }

  return client;
}

/** Ping Upstash; returns true when reachable. Does not throw. */
export async function pingUpstashRedis(): Promise<{ ok: boolean; error?: string }> {
  if (!isUpstashConfigured()) {
    return { ok: false, error: 'not_configured' };
  }

  try {
    const result = await getUpstashRedis().ping();
    if (result !== 'PONG') {
      return { ok: false, error: `unexpected_ping_response:${String(result)}` };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}
