import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { UserRole, UserStatus } from '@ilona/database';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { TeacherReadService } from './teacher-read.service';
import { getHireDateFromExperienceYears } from './teacher.util';

@Injectable()
export class TeacherWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readService: TeacherReadService,
  ) {}

  async create(dto: CreateTeacherDto, _currentUser?: JwtPayload) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user and teacher in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
        },
      });

      // Create teacher profile
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          bio: dto.bio,
          specialization: dto.specialization,
          hourlyRate: dto.hourlyRate,
          lessonRateAMD: dto.lessonRateAMD ?? undefined,
          hireDate:
            dto.experienceYears !== undefined && dto.experienceYears !== null
              ? getHireDateFromExperienceYears(dto.experienceYears)
              : undefined,
          workingDays: dto.workingDays ?? ['MON', 'TUE', 'WED', 'THU', 'FRI'],
          workingHours: dto.workingHours ?? undefined,
          videoUrl: dto.videoUrl ?? undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              status: true,
            },
          },
        },
      });

      if (dto.centerIds && dto.centerIds.length > 0) {
        await tx.teacherCenter.createMany({
          data: dto.centerIds.map((centerId) => ({
            teacherId: teacher.id,
            centerId,
          })),
          skipDuplicates: true,
        });
      }

      return teacher;
    });

    return result;
  }

  async update(id: string, dto: UpdateTeacherDto, currentUser?: JwtPayload) {
    const teacher = await this.readService.findById(id, currentUser);

    // Update user fields if provided
    if (dto.firstName || dto.lastName || dto.phone || dto.status) {
      await this.prisma.user.update({
        where: { id: teacher.user.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          status: dto.status,
        },
      });
    }

    if (dto.centerIds !== undefined) {
      await this.syncTeacherCenters(id, dto.centerIds);
    }

    // Update teacher fields (omit workingDays/workingHours when absent so existing values are preserved)
    return this.prisma.teacher.update({
      where: { id },
      data: {
        bio: dto.bio,
        specialization: dto.specialization,
        hourlyRate: dto.hourlyRate,
        lessonRateAMD: dto.lessonRateAMD,
        hireDate:
          dto.experienceYears === null
            ? null
            : dto.experienceYears !== undefined
              ? getHireDateFromExperienceYears(dto.experienceYears)
              : undefined,
        ...(dto.workingDays !== undefined ? { workingDays: dto.workingDays } : {}),
        ...(dto.workingHours !== undefined ? { workingHours: dto.workingHours } : {}),
        videoUrl: dto.videoUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
          },
        },
      },
    });
  }

  private async syncTeacherCenters(teacherId: string, centerIds: string[]): Promise<void> {
    const unique = Array.from(new Set(centerIds.filter((c) => !!c)));

    await this.prisma.$transaction(async (tx) => {
      await tx.teacherCenter.deleteMany({ where: { teacherId } });
      if (unique.length > 0) {
        await tx.teacherCenter.createMany({
          data: unique.map((centerId) => ({ teacherId, centerId })),
          skipDuplicates: true,
        });
      }
    });
  }

  async delete(id: string, currentUser?: JwtPayload) {
    const teacher = await this.readService.findById(id, currentUser);

    // Delete in transaction to handle foreign key constraints
    await this.prisma.$transaction(async (tx) => {
      // Delete related feedbacks first (they reference teacher)
      await tx.feedback.deleteMany({
        where: { teacherId: id },
      });

      // Delete related lessons (they reference teacher)
      // Note: This will cascade to attendances via lesson deletion
      await tx.lesson.deleteMany({
        where: { teacherId: id },
      });

      // Delete salary records (they have onDelete: Cascade but let's be explicit)
      await tx.salaryRecord.deleteMany({
        where: { teacherId: id },
      });

      // Delete deductions (they have onDelete: Cascade but let's be explicit)
      await tx.deduction.deleteMany({
        where: { teacherId: id },
      });

      // Groups will have teacherId set to null automatically (onDelete: SetNull)
      // But we need to update them explicitly
      await tx.group.updateMany({
        where: { teacherId: id },
        data: { teacherId: null },
      });

      // Delete chat participants for this user
      await tx.chatParticipant.deleteMany({
        where: { userId: teacher.user.id },
      });

      // Delete notifications for this user
      await tx.notification.deleteMany({
        where: { userId: teacher.user.id },
      });

      // Finally, delete the user (this will cascade to teacher due to onDelete: Cascade)
      await tx.user.delete({
        where: { id: teacher.user.id },
      });
    });

    return { success: true };
  }

  async deleteMany(ids: string[], currentUser?: JwtPayload) {
    if (!ids || ids.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Verify all teachers exist
    const teachers = await this.prisma.teacher.findMany({
      where: { id: { in: ids } },
      include: { user: true },
    });

    const managerCenterId = getManagerCenterIdOrThrow(currentUser);
    if (managerCenterId) {
      const accessibleTeacherIds = await this.prisma.group.findMany({
        where: {
          centerId: managerCenterId,
          teacherId: { in: ids },
        },
        select: { teacherId: true },
      });
      const accessibleSet = new Set(accessibleTeacherIds.map((entry) => entry.teacherId).filter(Boolean));
      if (accessibleSet.size !== ids.length) {
        throw new ForbiddenException('One or more teachers are outside your assigned center');
      }
    }

    if (teachers.length !== ids.length) {
      throw new NotFoundException('One or more teachers not found');
    }

    const userIds = teachers.map((t) => t.user.id);

    // Delete in transaction to handle foreign key constraints
    await this.prisma.$transaction(async (tx) => {
      // Delete related feedbacks
      await tx.feedback.deleteMany({
        where: { teacherId: { in: ids } },
      });

      // Delete related lessons
      await tx.lesson.deleteMany({
        where: { teacherId: { in: ids } },
      });

      // Delete salary records
      await tx.salaryRecord.deleteMany({
        where: { teacherId: { in: ids } },
      });

      // Delete deductions
      await tx.deduction.deleteMany({
        where: { teacherId: { in: ids } },
      });

      // Update groups to set teacherId to null
      await tx.group.updateMany({
        where: { teacherId: { in: ids } },
        data: { teacherId: null },
      });

      // Delete chat participants
      await tx.chatParticipant.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Delete notifications
      await tx.notification.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Finally, delete the users (this will cascade to teachers)
      await tx.user.deleteMany({
        where: { id: { in: userIds } },
      });
    });

    return { success: true, deletedCount: ids.length };
  }
}
