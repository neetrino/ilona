import type { ThrottlerStorage } from '@nestjs/throttler';
interface ThrottlerStorageRecord {
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
}
export declare class UpstashThrottlerStorage implements ThrottlerStorage {
    increment(key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string): Promise<ThrottlerStorageRecord>;
}
export {};
