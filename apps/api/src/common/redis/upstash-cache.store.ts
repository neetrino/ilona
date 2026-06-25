import type { Milliseconds, Store } from 'cache-manager';
import { getUpstashRedis } from './upstash.client';

const KEY_PREFIX = 'cache:';

function toFullKey(key: string): string {
  return `${KEY_PREFIX}${key}`;
}

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
      const value = await redis.get<T>(toFullKey(key));
      return value ?? undefined;
    },

    async set<T>(key: string, data: T, ttl?: Milliseconds): Promise<void> {
      const fullKey = toFullKey(key);
      const ex = ttlSeconds(ttl);

      if (ex != null) {
        await redis.set(fullKey, data, { ex });
        return;
      }

      await redis.set(fullKey, data);
    },

    async del(key: string): Promise<void> {
      await redis.del(toFullKey(key));
    },

    async reset(): Promise<void> {
      // Intentionally no-op: flushing all cache keys is unsafe in shared Redis.
    },

    async mset(args: Array<[string, unknown]>, ttl?: Milliseconds): Promise<void> {
      const ex = ttlSeconds(ttl);
      await Promise.all(
        args.map(([key, value]) =>
          ex != null
            ? redis.set(toFullKey(key), value, { ex })
            : redis.set(toFullKey(key), value),
        ),
      );
    },

    async mget(...keys: string[]): Promise<unknown[]> {
      return Promise.all(keys.map((key) => redis.get(toFullKey(key))));
    },

    async mdel(...keys: string[]): Promise<void> {
      if (keys.length === 0) {
        return;
      }

      await redis.del(...keys.map(toFullKey));
    },

    keys(): Promise<string[]> {
      // Intentionally empty: key scanning is unsafe in shared Redis.
      return Promise.resolve([]);
    },

    async ttl(key: string): Promise<number> {
      const seconds = await redis.ttl(toFullKey(key));
      if (seconds <= 0) {
        return seconds;
      }

      return seconds * 1000;
    },
  };
}
