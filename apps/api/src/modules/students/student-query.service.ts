import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserStatus } from '@ilona/database';

@Injectable()
export class StudentQueryService {
  private readonly logger = new Logger(StudentQueryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAssignedToTeacher(teacherId: string, params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: UserStatus;
    groupId?: string;
  }) {
    const { skip = 0, take = 50, search, status, groupId } = params || {};

    // Ensure skip and take are valid numbers
    const skipValue = Number(skip) || 0;
    const takeValue = Number(take) || 50;

    const where: Prisma.StudentWhereInput = {};
    const userWhere: Prisma.UserWhereInput = {};

    if (search) {
      const term = search.trim();
      if (term) {
        userWhere.OR = [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    // Default to ACTIVE status if not specified
    userWhere.status = status || 'ACTIVE';

    if (Object.keys(userWhere).length > 0) {
      where.user = userWhere;
    }

    if (groupId) {
      // When groupId is provided, verify the group belongs to this teacher
      // and show ALL students in that group (not just those with matching teacherId)
      const group = await this.prisma.group.findUnique({
        where: { id: groupId },
        select: { teacherId: true },
      });

      if (!group) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }

      if (group.teacherId !== teacherId) {
        throw new NotFoundException('Group is not assigned to this teacher');
      }

      // Show all students in this group
      where.groupId = groupId;
    } else {
      // When no groupId is provided, show all students assigned to this teacher
      where.teacherId = teacherId;
    }

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip: skipValue,
        take: takeValue,
        orderBy: { user: { firstName: 'asc' } },
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
            select: {
              id: true,
              name: true,
              level: true,
              center: { select: { id: true, name: true } },
            },
          },
          teacher: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      items,
      total,
      page: takeValue > 0 ? Math.floor(skipValue / takeValue) + 1 : 1,
      pageSize: takeValue,
      totalPages: takeValue > 0 ? Math.ceil(total / takeValue) : 0,
    };
  }

  async findAssignedToTeacherByUserId(userId: string, params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: UserStatus;
    groupId?: string;
  }) {
    try {
      // Get teacher by userId
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher profile not found');
      }

      return this.findAssignedToTeacher(teacher.id, params);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `findAssignedToTeacherByUserId failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Get teachers assigned to a student
   * Returns teachers from:
   * 1. Direct teacherId assignment
   * 2. Group's teacher (if student is in a group)
   */
  async getMyTeachers(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        group: {
          select: { teacherId: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const teacherIds = new Set<string>();

    // Add direct teacher assignment
    if (student.teacherId) {
      teacherIds.add(student.teacherId);
    }

    // Add group's teacher if student is in a group
    if (student.group?.teacherId) {
      teacherIds.add(student.group.teacherId);
    }

    if (teacherIds.size === 0) {
      return [];
    }

    // Fetch all assigned teachers
    const teachers = await this.prisma.teacher.findMany({
      where: {
        id: { in: Array.from(teacherIds) },
      },
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
      id: teacher.id,
      userId: teacher.userId,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      phone: teacher.user.phone,
      avatarUrl: teacher.user.avatarUrl,
    }));
  }
}






