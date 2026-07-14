import type { PrismaService } from '../prisma/prisma.service';
export declare const USER_CACHE_KEY_PREFIX = "user:";
export declare const USER_CACHE_TTL_MS: number;
export type UserByIdResult = NonNullable<Awaited<ReturnType<InstanceType<typeof PrismaService>['user']['findUnique']>>>;
export declare function isDatabaseConnectionError(error: unknown): boolean;
export declare function invalidateUserCache(cache: {
    del: (key: string) => Promise<unknown>;
}, userId: string): Promise<void>;
