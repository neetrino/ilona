import { Prisma } from '@ilona/database';
import type { PrismaService } from '../prisma/prisma.service';

export const USER_CACHE_KEY_PREFIX = 'user:';
export const USER_CACHE_TTL_MS = 90 * 1000; // 90s – balance freshness vs DB load from auth

/** Result shape of findById (matches select in findUnique). Used for cache cast. */
export type UserByIdResult = NonNullable<
  Awaited<
    ReturnType<
      InstanceType<typeof PrismaService>['user']['findUnique']
    >
  >
>;

export function isDatabaseConnectionError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const prismaConnectionErrorCodes = [
      'P1001', // Can't reach database server
      'P1002', // Database server closed the connection
      'P1008', // Operations timed out
      'P1017', // Server has closed the connection
    ];

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return prismaConnectionErrorCodes.includes(error.code);
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      const message = error.message.toLowerCase();
      return (
        message.includes('server has closed the connection') ||
        message.includes('connection reset') ||
        message.includes('econnreset') ||
        message.includes('connection closed')
      );
    }

    const message = error.message.toLowerCase();
    const code = (error as { code?: string | number }).code;
    return (
      message.includes('econnreset') ||
      message.includes('connection reset') ||
      message.includes('server has closed the connection') ||
      code === 'ECONNRESET' ||
      code === 10054
    );
  }

export async function invalidateUserCache(
  cache: { del: (key: string) => Promise<unknown> },
  userId: string,
): Promise<void> {
  try {
    await cache.del(USER_CACHE_KEY_PREFIX + userId);
  } catch {
    // ignore cache errors
  }
}
