import { Injectable, NotFoundException, ServiceUnavailableException, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@ilona/database';
import {
  USER_CACHE_KEY_PREFIX,
  USER_CACHE_TTL_MS,
  UserByIdResult,
  isDatabaseConnectionError,
  invalidateUserCache as invalidateUserCacheEntry,
} from './user.util';

@Injectable()
export class UserReadService {
  private readonly logger = new Logger(UserReadService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  invalidateUserCache(userId: string) {
    return invalidateUserCacheEntry(this.cache, userId);
  }

  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      if (isDatabaseConnectionError(error)) {
        this.logger.error('Database connection error in findByEmail', error);
        throw new ServiceUnavailableException('Database unavailable, please retry');
      }
      throw error;
    }
  }

  async findAuthById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });
  }

  async getManagerCenterId(userId: string): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<Array<{ centerId: string }>>`
      SELECT "centerId"
      FROM "manager_profiles"
      WHERE "userId" = ${userId}
        AND "isCurrentAssignment" = true
      LIMIT 1
    `;
    return rows[0]?.centerId ?? null;
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

      const managerCenterId = user.role === UserRole.MANAGER
        ? await this.getManagerCenterId(user.id)
        : null;
      const enrichedUser = { ...user, managerCenterId };

      await this.cache.set(cacheKey, enrichedUser, USER_CACHE_TTL_MS);
      return enrichedUser;
    } catch (error) {
      // Re-throw NotFoundException as-is
      if (error instanceof NotFoundException) {
        throw error;
      }

      // If it's a database connection error, return 503
      if (isDatabaseConnectionError(error)) {
        this.logger.error('Database connection error in findById', error);
        throw new ServiceUnavailableException('Database unavailable, please retry');
      }

      // Re-throw other errors
      throw error;
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

  async findManagers() {
    const managers = await this.prisma.user.findMany({
      where: {
        role: UserRole.MANAGER,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const managerIds = managers.map((manager) => manager.id);
    if (managerIds.length === 0) {
      return managers;
    }

    const rows = await this.prisma.$queryRaw<
      Array<{
        userId: string;
        centerId: string;
        centerName: string;
        isCurrentAssignment: boolean;
        lastManagedCenterId: string | null;
        lastManagedCenterName: string | null;
        lastManagedAt: Date | null;
      }>
    >`
      SELECT
        mp."userId",
        mp."centerId",
        mp."isCurrentAssignment",
        mp."lastManagedCenterId",
        mp."lastManagedCenterName",
        mp."lastManagedAt",
        c."name" as "centerName"
      FROM "manager_profiles" mp
      JOIN "centers" c ON c."id" = mp."centerId"
      WHERE mp."userId" IN (${Prisma.join(managerIds)})
    `;

    const profileMap = new Map(rows.map((row) => [row.userId, row]));
    return managers.map((manager) => {
      const profile = profileMap.get(manager.id);
      return {
        ...manager,
        managerProfile: profile
          ? {
              centerId: profile.centerId,
              isCurrentAssignment: profile.isCurrentAssignment,
              center: {
                id: profile.centerId,
                name: profile.centerName,
              },
              lastManaged:
                profile.lastManagedAt && profile.lastManagedCenterId
                  ? {
                      centerId: profile.lastManagedCenterId,
                      centerName: profile.lastManagedCenterName ?? profile.centerName,
                      managedAt: profile.lastManagedAt.toISOString(),
                    }
                  : null,
            }
          : null,
      };
    });
  }
}
