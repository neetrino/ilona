import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';

@Injectable()
export class StudentReadService {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string, currentUserId?: string, userRole?: UserRole) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        group: {
          include: {
            center: true,
            teacher: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
        center: { select: { id: true, name: true } },
        attendances: {
          take: 10,
          orderBy: { lesson: { scheduledAt: 'desc' } },
          include: {
            markedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            lesson: {
              select: { id: true, scheduledAt: true, topic: true },
            },
          },
        },
        feedbacks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            lesson: { select: { id: true, scheduledAt: true, topic: true } },
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        payments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    if (userRole === UserRole.MANAGER && currentUserId) {
      const managerProfile = await this.prisma.$queryRaw<Array<{ centerId: string }>>`
        SELECT "centerId" FROM "manager_profiles"
        WHERE "userId" = ${currentUserId} AND "isCurrentAssignment" = true
        LIMIT 1
      `;
      const managerCenterId = managerProfile[0]?.centerId;
      if (!managerCenterId) {
        throw new ForbiddenException('Manager account is not assigned to a center');
      }
      const inManagerCenter =
        student.group?.centerId === managerCenterId || student.centerId === managerCenterId;
      if (!inManagerCenter) {
        throw new ForbiddenException('You do not have access to this student');
      }
    }

    // Authorization check: If user is a teacher, verify they are assigned to this student
    if (userRole === UserRole.TEACHER && currentUserId) {
      // Get teacher by userId
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      // Check if teacher is assigned to this student
      // Teacher is assigned if:
      // 1. Student has direct teacherId assignment matching this teacher, OR
      // 2. Student is in a group that has this teacher assigned
      const isAssigned =
        student.teacherId === teacher.id ||
        (student.group?.teacherId === teacher.id);

      if (!isAssigned) {
        throw new ForbiddenException('You do not have access to this student');
      }
    }

    const groupHistory = await this.prisma.$queryRaw<Array<{
      id: string;
      groupId: string;
      joinedAt: Date;
      leftAt: Date | null;
      group_name: string;
      group_level: string | null;
      center_id: string;
      center_name: string;
    }>>`
      SELECT
        h."id",
        h."groupId",
        h."joinedAt",
        h."leftAt",
        g."name" AS "group_name",
        g."level" AS "group_level",
        c."id" AS "center_id",
        c."name" AS "center_name"
      FROM "student_group_histories" h
      INNER JOIN "groups" g ON g."id" = h."groupId"
      INNER JOIN "centers" c ON c."id" = g."centerId"
      WHERE h."studentId" = ${id}
      ORDER BY h."joinedAt" DESC
    `;

    return {
      ...student,
      groupHistory: groupHistory.map((entry) => ({
        id: entry.id,
        groupId: entry.groupId,
        joinedAt: entry.joinedAt,
        leftAt: entry.leftAt,
        group: {
          id: entry.groupId,
          name: entry.group_name,
          level: entry.group_level,
          center: {
            id: entry.center_id,
            name: entry.center_name,
          },
        },
      })),
    };
  }

  async findByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
        group: {
          include: {
            center: true,
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
            _count: { select: { students: true } },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student profile not found`);
    }

    return student;
  }
}
