/**
 * Environment-scoped Redis key prefixes (Security 7.2).
 * Prevents key collisions across apps and environments on a shared Upstash DB.
 */
function redisEnvSegment(): 'prod' | 'dev' {
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
}

export function redisRootPrefix(): string {
  return `ilona:${redisEnvSegment()}`;
}

export function toCacheKey(key: string): string {
  return `${redisRootPrefix()}:cache:${key}`;
}

export function toThrottleKey(key: string): string {
  return `${redisRootPrefix()}:throttle:${key}`;
}
