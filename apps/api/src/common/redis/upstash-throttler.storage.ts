import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { getUpstashRedis } from './upstash.client';

const STORAGE_PREFIX = 'throttle:';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

interface StoredThrottleRecord {
  totalHits: Record<string, number>;
  expiresAt: number;
  blockExpiresAt: number;
  isBlocked: boolean;
}

function emptyRecord(throttlerName: string, now: number, ttlMs: number): StoredThrottleRecord {
  return {
    totalHits: { [throttlerName]: 0 },
    expiresAt: now + ttlMs,
    blockExpiresAt: 0,
    isBlocked: false,
  };
}

function secondsUntil(timestamp: number, now: number): number {
  return Math.ceil((timestamp - now) / 1000);
}

@Injectable()
export class UpstashThrottlerStorage implements ThrottlerStorage {
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redis = getUpstashRedis();
    const storageKey = `${STORAGE_PREFIX}${key}`;
    const now = Date.now();
    const ttlMs = ttl;
    const blockDurationMs = blockDuration;

    let record =
      (await redis.get<StoredThrottleRecord>(storageKey)) ??
      emptyRecord(throttlerName, now, ttlMs);

    if (record.totalHits[throttlerName] == null) {
      record.totalHits[throttlerName] = 0;
    }

    let timeToExpire = secondsUntil(record.expiresAt, now);
    if (timeToExpire <= 0) {
      record.expiresAt = now + ttlMs;
      timeToExpire = secondsUntil(record.expiresAt, now);
    }

    if (!record.isBlocked) {
      record.totalHits[throttlerName] += 1;
    }

    if (record.totalHits[throttlerName] > limit && !record.isBlocked) {
      record.isBlocked = true;
      record.blockExpiresAt = now + blockDurationMs;
    }

    let timeToBlockExpire = secondsUntil(record.blockExpiresAt, now);
    if (timeToBlockExpire <= 0 && record.isBlocked) {
      record.isBlocked = false;
      record.totalHits[throttlerName] = 1;
      timeToBlockExpire = 0;
      timeToExpire = secondsUntil(record.expiresAt, now);
    }

    const redisTtlSeconds = Math.max(
      timeToExpire,
      timeToBlockExpire,
      1,
    );

    await redis.set(storageKey, record, { ex: redisTtlSeconds });

    return {
      totalHits: record.totalHits[throttlerName],
      timeToExpire,
      isBlocked: record.isBlocked,
      timeToBlockExpire: Math.max(timeToBlockExpire, 0),
    };
  }
}
