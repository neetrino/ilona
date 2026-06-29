import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole, UserStatus } from '@ilona/database';
import * as bcrypt from 'bcrypt';
import { currentManagerAssignmentWhere } from '../../common/utils/manager-profile.util';
import { UserReadService } from './user-read.service';

@Injectable()
export class UserManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readService: UserReadService,
  ) {}

  async createManager(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    centerId: string;
  }) {
    const email = data.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    let manager:
      | {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          phone: string | null;
          role: UserRole;
          status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
          createdAt: Date;
        }
      | null = null;

    try {
      manager = await this.prisma.$transaction(async (tx) => {
        const centerRows = await tx.$queryRaw<Array<{ id: string; isActive: boolean }>>`
          SELECT "id", "isActive"
          FROM "centers"
          WHERE "id" = ${data.centerId}
          FOR UPDATE
        `;
        const center = centerRows[0];
        if (!center) {
          throw new BadRequestException('Center not found');
        }
        if (!center.isActive) {
          throw new BadRequestException('Cannot assign manager to inactive center');
        }

        const existingManagerForCenter = await tx.managerProfile.findFirst({
          where: { centerId: data.centerId, ...currentManagerAssignmentWhere },
          select: { id: true },
        });
        if (existingManagerForCenter) {
          throw new ConflictException('Selected center already has an active manager assigned');
        }

        const user = await tx.user.create({
          data: {
            email,
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : '';
        if (target.includes('email')) {
          throw new ConflictException('Email already registered');
        }
        if (target.includes('centerId')) {
          throw new ConflictException('Selected center already has a manager assigned');
        }
      }
      throw error;
    }

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

  async updateManager(
    managerId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      password?: string;
      centerId?: string;
      status?: UserStatus;
    },
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { id: managerId, role: UserRole.MANAGER },
      select: {
        id: true,
        email: true,
        status: true,
        managerProfile: {
          select: { id: true, centerId: true, isCurrentAssignment: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Manager not found');
    }

    const email = data.email?.trim().toLowerCase();
    if (email && email !== existing.email) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingByEmail && existingByEmail.id !== managerId) {
        throw new ConflictException('Email already registered');
      }
    }

    const passwordHash =
      data.password && data.password.length > 0
        ? await bcrypt.hash(data.password, 10)
        : undefined;

    const nextStatus = data.status ?? existing.status;
    const targetCenterId = data.centerId ?? existing.managerProfile?.centerId;
    const reactivating = nextStatus === 'ACTIVE' && existing.status !== 'ACTIVE';
    const willRemainInactive = nextStatus !== 'ACTIVE';
    const centerChanged = Boolean(
      data.centerId && data.centerId !== existing.managerProfile?.centerId,
    );
    const shouldReleaseAssignment =
      (nextStatus !== 'ACTIVE' && existing.managerProfile?.isCurrentAssignment === true) ||
      (existing.status === 'ACTIVE' && nextStatus !== 'ACTIVE');
    const shouldUpdatePendingCenter =
      willRemainInactive &&
      existing.status !== 'ACTIVE' &&
      Boolean(data.centerId) &&
      centerChanged;
    const shouldAssignProfile =
      nextStatus === 'ACTIVE' &&
      Boolean(targetCenterId) &&
      (centerChanged ||
        reactivating ||
        !existing.managerProfile ||
        existing.managerProfile.isCurrentAssignment === false);

    if (reactivating && !targetCenterId) {
      throw new BadRequestException(
        'Please assign this Manager to a center before activating.',
      );
    }

    if (data.centerId) {
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
    }

    const pendingOrAssignCenterId = shouldUpdatePendingCenter
      ? data.centerId
      : shouldAssignProfile
        ? targetCenterId
        : undefined;

    if (pendingOrAssignCenterId) {
      const otherCurrent = await this.prisma.managerProfile.findFirst({
        where: {
          centerId: pendingOrAssignCenterId,
          ...currentManagerAssignmentWhere,
          userId: { not: managerId },
        },
        select: { id: true },
      });
      if (otherCurrent) {
        throw new ConflictException('Selected center already has an active manager assigned');
      }
    }

    const userUpdateData = {
      ...(email !== undefined && { email }),
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(passwordHash !== undefined && { passwordHash }),
      ...(data.status !== undefined && { status: data.status }),
    };
    const hasUserUpdate = Object.keys(userUpdateData).length > 0;
    const userSelect = {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    } as const;

    try {
      const manager =
        shouldReleaseAssignment || shouldAssignProfile || shouldUpdatePendingCenter
          ? await this.prisma.$transaction(
              async (tx) => {
                if (shouldReleaseAssignment) {
                  const currentAssignment = await tx.managerProfile.findFirst({
                    where: { userId: managerId, ...currentManagerAssignmentWhere },
                    select: { centerId: true },
                  });
                  const releaseCenter = currentAssignment
                    ? await tx.center.findUnique({
                        where: { id: currentAssignment.centerId },
                        select: { name: true },
                      })
                    : null;

                  await tx.managerProfile.updateMany({
                    where: { userId: managerId, ...currentManagerAssignmentWhere },
                    data: {
                      isCurrentAssignment: false,
                      ...(currentAssignment
                        ? {
                            lastManagedCenterId: currentAssignment.centerId,
                            lastManagedCenterName: releaseCenter?.name ?? null,
                            lastManagedAt: new Date(),
                          }
                        : {}),
                    },
                  });
                }

                if (shouldUpdatePendingCenter && data.centerId) {
                  if (existing.managerProfile) {
                    await tx.managerProfile.update({
                      where: { userId: managerId },
                      data: { centerId: data.centerId },
                    });
                  } else {
                    await tx.managerProfile.create({
                      data: {
                        userId: managerId,
                        centerId: data.centerId,
                        isCurrentAssignment: false,
                      },
                    });
                  }
                }

                if (shouldAssignProfile && targetCenterId) {
                  if (existing.managerProfile) {
                    await tx.managerProfile.update({
                      where: { userId: managerId },
                      data: {
                        centerId: targetCenterId,
                        isCurrentAssignment: true,
                      },
                    });
                  } else {
                    await tx.managerProfile.create({
                      data: {
                        userId: managerId,
                        centerId: targetCenterId,
                        isCurrentAssignment: true,
                      },
                    });
                  }
                }

                if (hasUserUpdate) {
                  return tx.user.update({
                    where: { id: managerId },
                    data: userUpdateData,
                    select: userSelect,
                  });
                }

                return tx.user.findUniqueOrThrow({
                  where: { id: managerId },
                  select: userSelect,
                });
              },
              { timeout: 15_000, maxWait: 10_000 },
            )
          : hasUserUpdate
            ? await this.prisma.user.update({
                where: { id: managerId },
                data: userUpdateData,
                select: userSelect,
              })
            : await this.prisma.user.findUniqueOrThrow({
                where: { id: managerId },
                select: userSelect,
              });

      await this.readService.invalidateUserCache(managerId);

      const profile = await this.prisma.managerProfile.findUnique({
        where: { userId: managerId },
        select: {
          centerId: true,
          isCurrentAssignment: true,
          lastManagedCenterId: true,
          lastManagedCenterName: true,
          lastManagedAt: true,
          center: { select: { id: true, name: true } },
        },
      });

      return {
        ...manager,
        managerProfile: profile
          ? {
              centerId: profile.centerId,
              isCurrentAssignment: profile.isCurrentAssignment,
              center: profile.center,
              lastManaged:
                profile.lastManagedAt && profile.lastManagedCenterId
                  ? {
                      centerId: profile.lastManagedCenterId,
                      centerName:
                        profile.lastManagedCenterName ?? profile.center.name,
                      managedAt: profile.lastManagedAt.toISOString(),
                    }
                  : null,
            }
          : null,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : '';
        if (target.includes('email')) {
          throw new ConflictException('Email already registered');
        }
        if (target.includes('centerId')) {
          throw new ConflictException('Selected center already has an active manager assigned');
        }
      }
      throw error;
    }
  }
}
