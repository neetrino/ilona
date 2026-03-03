import { Injectable, NotFoundException, ServiceUnavailableException, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';

const USER_CACHE_KEY_PREFIX = 'user:';
const USER_CACHE_TTL_MS = 90 * 1000; // 90s – balance freshness vs DB load from auth

/** Result shape of findById (matches select in findUnique). Used for cache cast. */
type UserByIdResult = NonNullable<
  Awaited<
    ReturnType<
      InstanceType<typeof PrismaService>['user']['findUnique']
    >
  >
>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /**
   * Checks if an error is a database connection error.
   */
  private isDatabaseConnectionError(error: unknown): boolean {
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

  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      if (this.isDatabaseConnectionError(error)) {
        this.logger.error('Database connection error in findByEmail', error);
        throw new ServiceUnavailableException('Database unavailable, please retry');
      }
      throw error;
    }
  }

  async findById(id: string) {
    const cacheKey = USER_CACHE_KEY_PREFIX + id;
    try {
      const cached = await this.cache.get(cacheKey);
      if (cached != null) {
        return cached as UserByIdResult;
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          teacher: true,
          student: {
            include: {
              group: {
                include: {
                  center: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.cache.set(cacheKey, user, USER_CACHE_TTL_MS);
      return user;
    } catch (error) {
      // Re-throw NotFoundException as-is
      if (error instanceof NotFoundException) {
        throw error;
      }

      // If it's a database connection error, return 503
      if (this.isDatabaseConnectionError(error)) {
        this.logger.error('Database connection error in findById', error);
        throw new ServiceUnavailableException('Database unavailable, please retry');
      }

      // Re-throw other errors
      throw error;
    }
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      await this.cache.del(USER_CACHE_KEY_PREFIX + userId);
    } catch {
      // ignore cache errors
    }
  }

  async findAll(filters?: { role?: UserRole; status?: string }) {
    return this.prisma.user.findMany({
      where: {
        role: filters?.role,
        status: filters?.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Updates lastLoginAt for analytics. Does NOT invalidate user cache:
   * lastLoginAt is not used for authorization; cache TTL (90s) is sufficient for correctness.
   * Invalidating on every login would force the next request to hit DB; we avoid that.
   */
  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async update(userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          teacher: true,
          student: {
            include: {
              group: {
                include: {
                  center: true,
                },
              },
            },
          },
        },
      });

      await this.invalidateUserCache(userId);
      return user;
    } catch (error) {
      if (this.isDatabaseConnectionError(error)) {
        this.logger.error('Database connection error in update', error);
        throw new ServiceUnavailableException('Database unavailable, please retry');
      }
      throw error;
    }
  }
}
