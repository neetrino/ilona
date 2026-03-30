import { Injectable, NotFoundException, ServiceUnavailableException, Logger, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@ilona/database';
import * as bcrypt from 'bcrypt';

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

    const rows = await this.prisma.$queryRaw<Array<{ userId: string; centerId: string; centerName: string }>>`
      SELECT mp."userId", mp."centerId", c."name" as "centerName"
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
              center: {
                id: profile.centerId,
                name: profile.centerName,
              },
            }
          : null,
      };
    });
  }

  async createManager(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    centerId: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const center = await this.prisma.center.findUnique({
      where: { id: data.centerId },
      select: { id: true, isActive: true },
    });

    if (!center) {
      throw new BadRequestException('Center not found');
    }

    if (!center.isActive) {
      throw new BadRequestException('Cannot assign manager to inactive center');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const manager = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone ?? null,
          role: UserRole.MANAGER,
          status: 'ACTIVE',
        },
      });

      await tx.managerProfile.create({
        data: {
          userId: user.id,
          centerId: data.centerId,
        },
      });

      return tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    });

    if (!manager) {
      throw new ServiceUnavailableException('Failed to create manager');
    }

    const centerRow = await this.prisma.center.findUnique({
      where: { id: data.centerId },
      select: { id: true, name: true },
    });

    return {
      ...manager,
      managerProfile: centerRow
        ? {
            centerId: centerRow.id,
            center: centerRow,
          }
        : null,
    };
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

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    await this.invalidateUserCache(userId);
  }

  async update(userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string; email?: string }) {
    try {
      const normalizedEmail = data.email?.trim().toLowerCase();
      if (normalizedEmail) {
        const currentUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true },
        });

        if (!currentUser) {
          throw new NotFoundException('User not found');
        }

        if (normalizedEmail !== currentUser.email) {
          const existingByEmail = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true },
          });

          if (existingByEmail && existingByEmail.id !== userId) {
            throw new ConflictException('Email already registered');
          }
        }
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(normalizedEmail !== undefined && { email: normalizedEmail }),
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

      const managerCenterId = user.role === UserRole.MANAGER
        ? await this.getManagerCenterId(user.id)
        : null;
      const enrichedUser = { ...user, managerCenterId };

      await this.invalidateUserCache(userId);
      return enrichedUser;
    } catch (error) {
      if (this.isDatabaseConnectionError(error)) {
        this.logger.error('Database connection error in update', error);
        throw new ServiceUnavailableException('Database unavailable, please retry');
      }
      throw error;
    }
  }
}
