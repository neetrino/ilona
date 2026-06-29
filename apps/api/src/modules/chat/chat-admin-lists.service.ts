import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@ilona/database';
import { formatUserFullName } from './chat-list.util';

@Injectable()
export class ChatAdminListsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminStudents(_adminId: string, search?: string, branchCenterId?: string) {
    const where: Prisma.StudentWhereInput = {
      user: {
        role: 'STUDENT',
        status: 'ACTIVE',
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      ...(branchCenterId
        ? {
            OR: [{ group: { centerId: branchCenterId } }, { centerId: branchCenterId }],
          }
        : {}),
    };

    const students = await this.prisma.student.findMany({
      where,
      take: 100,
      orderBy: { user: { firstName: 'asc' } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    return students.map((student) => ({
      id: student.user.id,
      name: formatUserFullName(student.user.firstName, student.user.lastName),
      phone: student.user.phone,
      avatarUrl: student.user.avatarUrl,
    }));
  }

  async getAdminTeachers(_adminId: string, search?: string, branchCenterId?: string) {
    const where: Prisma.TeacherWhereInput = {
      user: {
        role: 'TEACHER',
        status: 'ACTIVE',
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      ...(branchCenterId
        ? {
            OR: [
              { centerLinks: { some: { centerId: branchCenterId } } },
              { groups: { some: { centerId: branchCenterId } } },
            ],
          }
        : {}),
    };

    const teachers = await this.prisma.teacher.findMany({
      where,
      take: 100,
      orderBy: { user: { firstName: 'asc' } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    return teachers.map((teacher) => ({
      id: teacher.user.id,
      name: formatUserFullName(teacher.user.firstName, teacher.user.lastName),
      phone: teacher.user.phone,
      avatarUrl: teacher.user.avatarUrl,
    }));
  }

  async getAdminGroups(_adminId: string, search?: string, branchCenterId?: string) {
    const where: Prisma.GroupWhereInput = {
      isActive: true,
      ...(branchCenterId ? { centerId: branchCenterId } : {}),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const groups = await this.prisma.group.findMany({
      where,
      take: 100,
      orderBy: { name: 'asc' },
      include: {
        center: {
          select: { id: true, name: true },
        },
      },
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      iconKey: group.iconKey,
      center: group.center ? { id: group.center.id, name: group.center.name } : null,
    }));
  }

  async getAdminAllUsers(_adminId: string, search?: string, branchCenterId?: string) {
    const where: Prisma.UserWhereInput = {
      status: 'ACTIVE',
      ...(branchCenterId
        ? {
            role: { in: [UserRole.STUDENT, UserRole.TEACHER, UserRole.MANAGER] },
            OR: [
              {
                role: UserRole.STUDENT,
                student: {
                  OR: [{ group: { centerId: branchCenterId } }, { centerId: branchCenterId }],
                },
              },
              {
                role: UserRole.TEACHER,
                teacher: {
                  OR: [
                    { centerLinks: { some: { centerId: branchCenterId } } },
                    { groups: { some: { centerId: branchCenterId } } },
                  ],
                },
              },
              {
                role: UserRole.MANAGER,
                managerProfile: {
                  centerId: branchCenterId,
                  isCurrentAssignment: true,
                },
              },
            ],
          }
        : {}),
      ...(search &&
        search.trim() && {
          OR: [
            { firstName: { contains: search.trim(), mode: 'insensitive' } },
            { lastName: { contains: search.trim(), mode: 'insensitive' } },
            { email: { contains: search.trim(), mode: 'insensitive' } },
            { phone: { contains: search.trim(), mode: 'insensitive' } },
          ],
        }),
    };

    const users = await this.prisma.user.findMany({
      where,
      take: 100,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      name: formatUserFullName(u.firstName, u.lastName),
      email: u.email,
      phone: u.phone ?? undefined,
      avatarUrl: u.avatarUrl ?? undefined,
      role: u.role,
    }));
  }
}
