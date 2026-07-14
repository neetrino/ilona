import { Redis } from '@upstash/redis';

let client: Redis | null = null;

/** Strip wrapping quotes some env loaders leave on Windows / nested dotenv. */
function cleanEnv(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function isUpstashConfigured(): boolean {
  return Boolean(
    cleanEnv(process.env.UPSTASH_REDIS_REST_URL) &&
      cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN),
  );
}

export function getUpstashRedis(): Redis {
  const url = cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
  const token = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (!url || !token) {
    throw new Error(
      'Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
    );
  }

  if (!client) {
    client = new Redis({ url, token });
  }

  return client;
}
