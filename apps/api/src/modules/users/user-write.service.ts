import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';
import { UserReadService } from './user-read.service';
import { isDatabaseConnectionError } from './user.util';

@Injectable()
export class UserWriteService {
  private readonly logger = new Logger(UserWriteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly readService: UserReadService,
  ) {}

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
    await this.readService.invalidateUserCache(userId);
  }

  async update(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatarUrl?: string;
      email?: string;
      videoUrl?: string | null;
      bio?: string | null;
      experienceYears?: number | null;
    },
  ) {
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

      if (data.videoUrl !== undefined) {
        await this.prisma.teacher.updateMany({
          where: { userId },
          data: { videoUrl: data.videoUrl ?? null },
        });
      }

      if (data.bio !== undefined) {
        await this.prisma.teacher.updateMany({
          where: { userId },
          data: { bio: data.bio ?? null },
        });
      }

      if (data.experienceYears !== undefined) {
        const currentYear = new Date().getFullYear();
        await this.prisma.teacher.updateMany({
          where: { userId },
          data: {
            hireDate:
              data.experienceYears === null
                ? null
                : new Date(currentYear - data.experienceYears, 0, 1),
          },
        });
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
        ? await this.readService.getManagerCenterId(user.id)
        : null;
      const enrichedUser = { ...user, managerCenterId };

      await this.readService.invalidateUserCache(userId);
      return enrichedUser;
    } catch (error) {
      if (isDatabaseConnectionError(error)) {
        this.logger.error('Database connection error in update', error);
        throw new ServiceUnavailableException('Database unavailable, please retry');
      }
      throw error;
    }
  }
}
