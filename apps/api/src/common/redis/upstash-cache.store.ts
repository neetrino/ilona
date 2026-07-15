import type { Milliseconds, Store } from 'cache-manager';
import { toCacheKey } from './redis-keys';
import { getUpstashRedis } from './upstash.client';

function ttlSeconds(ttl?: Milliseconds): number | undefined {
  if (ttl == null || ttl <= 0) {
    return undefined;
  }

  return Math.max(1, Math.ceil(ttl / 1000));
}

export function createUpstashCacheStore(): Store {
  const redis = getUpstashRedis();

  return {
    async get<T>(key: string): Promise<T | undefined> {
      const value = await redis.get<T>(toCacheKey(key));
      return value ?? undefined;
    },

    async set<T>(key: string, data: T, ttl?: Milliseconds): Promise<void> {
      const fullKey = toCacheKey(key);
      const ex = ttlSeconds(ttl);

      if (ex != null) {
        await redis.set(fullKey, data, { ex });
        return;
      }

      await redis.set(fullKey, data);
    },

    async del(key: string): Promise<void> {
      await redis.del(toCacheKey(key));
    },

    async reset(): Promise<void> {
      // Intentionally no-op: flushing all cache keys is unsafe in shared Redis.
    },

    async mset(args: Array<[string, unknown]>, ttl?: Milliseconds): Promise<void> {
      const ex = ttlSeconds(ttl);
      await Promise.all(
        args.map(([key, value]) =>
          ex != null
            ? redis.set(toCacheKey(key), value, { ex })
            : redis.set(toCacheKey(key), value),
        ),
      );
    },

    async mget(...keys: string[]): Promise<unknown[]> {
      return Promise.all(keys.map((key) => redis.get(toCacheKey(key))));
    },

    async mdel(...keys: string[]): Promise<void> {
      if (keys.length === 0) {
        return;
      }

      await redis.del(...keys.map(toCacheKey));
    },

    keys(): Promise<string[]> {
      // Intentionally empty: key scanning is unsafe in shared Redis.
      return Promise.resolve([]);
    },

    async ttl(key: string): Promise<number> {
      const seconds = await redis.ttl(toCacheKey(key));
      if (seconds <= 0) {
        return seconds;
      }

      return seconds * 1000;
    },
  };
}
