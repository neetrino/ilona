import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { Prisma, UserRole, UserStatus } from '@ilona/database';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import {
  FIXED_GROUP_MAX_STUDENTS,
  GROUP_CAPACITY_EXCEEDED_MESSAGE,
} from '../groups/group.constants';

@Injectable()
export class StudentCrudService {
  constructor(private readonly prisma: PrismaService) {}

  private async syncStudentGroupHistory(
    tx: Prisma.TransactionClient,
    studentId: string,
    previousGroupId: string | null,
    nextGroupId: string | null,
    joinedAt: Date = new Date(),
  ) {
    if (previousGroupId === nextGroupId) {
      return;
    }

    if (previousGroupId) {
      await tx.$executeRaw`
        UPDATE "student_group_histories"
        SET "leftAt" = ${joinedAt}, "updatedAt" = ${joinedAt}
        WHERE "studentId" = ${studentId} AND "leftAt" IS NULL
      `;
    }

    if (nextGroupId) {
      await tx.$executeRaw`
        INSERT INTO "student_group_histories" ("id", "studentId", "groupId", "joinedAt", "createdAt", "updatedAt")
        VALUES (${randomUUID()}, ${studentId}, ${nextGroupId}, ${joinedAt}, ${joinedAt}, ${joinedAt})
      `;
    }
  }

  private async assertManagerStudentAccess(studentId: string, currentUserId?: string, userRole?: UserRole) {
    if (userRole !== UserRole.MANAGER || !currentUserId) {
      return;
    }

    const managerProfile = await this.prisma.$queryRaw<Array<{ centerId: string }>>`
      SELECT "centerId" FROM "manager_profiles" WHERE "userId" = ${currentUserId} LIMIT 1
    `;

    const managerCenterId = managerProfile[0]?.centerId;
    if (!managerCenterId) {
      throw new ForbiddenException('Manager account is not assigned to a center');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        group: {
          select: { centerId: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    if (student.group?.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this student');
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    groupId?: string;
    groupIds?: string[];
    status?: UserStatus;
    statusIds?: UserStatus[];
    teacherId?: string;
    teacherIds?: string[];
    centerId?: string;
    centerIds?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    month?: number;
    year?: number;
    currentUserId?: string;
    userRole?: UserRole;
  }) {
    const { skip = 0, take = 50, search, groupId, groupIds, status, statusIds, teacherId, teacherIds, centerId, centerIds, sortBy, sortOrder = 'asc', currentUserId, userRole } = params || {};

    const where: Prisma.StudentWhereInput = {};
    const userWhere: Prisma.UserWhereInput = {};

    // Teacher scoping: only allow access to students in groups assigned to the teacher
    let teacherGroupIds: string[] | null = null;
    if (userRole === UserRole.TEACHER && currentUserId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });
      if (!teacher) {
        return { items: [], total: 0, page: 1, pageSize: take, totalPages: 0, totalMonthlyFees: 0 };
      }
      const groups = await this.prisma.group.findMany({
        where: { teacherId: teacher.id, isActive: true },
        select: { id: true },
      });
      teacherGroupIds = groups.map((g) => g.id);

      const requestedGroupIds = groupIds && groupIds.length > 0 ? groupIds : groupId ? [groupId] : [];
      if (requestedGroupIds.length > 0) {
        const notAllowed = requestedGroupIds.filter((id) => !(teacherGroupIds ?? []).includes(id));
        if (notAllowed.length > 0) {
          throw new ForbiddenException('You do not have access to this group');
        }
      } else {
        // No group filter: restrict to teacher's groups only
        if (teacherGroupIds.length === 0) {
          return { items: [], total: 0, page: 1, pageSize: take, totalPages: 0, totalMonthlyFees: 0 };
        }
        where.groupId = { in: teacherGroupIds };
      }
    }

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

    // Filter by status (single or multiple)
    if (statusIds && statusIds.length > 0) {
      userWhere.status = { in: statusIds };
    } else if (status) {
      userWhere.status = status;
    }

    if (Object.keys(userWhere).length > 0) {
      where.user = userWhere;
    }

    // Support both single groupId (backward compatibility) and groupIds array (only if not already set by teacher scope)
    if (teacherGroupIds === null) {
      if (groupIds && groupIds.length > 0) {
        where.groupId = { in: groupIds };
      } else if (groupId) {
        where.groupId = groupId;
      }
    }

    // Filter by teacherId (single or multiple)
    if (teacherIds && teacherIds.length > 0) {
      where.teacherId = { in: teacherIds };
    } else if (teacherId) {
      where.teacherId = teacherId;
    }

    // Filter by centerId (via group relation)
    if (centerIds && centerIds.length > 0) {
      where.group = { centerId: { in: centerIds } };
    } else if (centerId) {
      where.group = { centerId };
    }

    // Build orderBy based on sortBy parameter
    // Only 'absence' requires in-memory sort (depends on computed attendance). 'student' uses DB orderBy.
    let orderBy: Prisma.StudentOrderByWithRelationInput | Prisma.StudentOrderByWithRelationInput[];
    if (sortBy === 'student') {
      orderBy = [
        { user: { firstName: sortOrder } },
        { user: { lastName: sortOrder } },
      ];
    } else if (sortBy === 'monthlyFee') {
      orderBy = { monthlyFee: sortOrder };
    } else if (sortBy === 'register') {
      orderBy = { registerDate: sortOrder };
    } else if (sortBy === 'absence') {
      orderBy = [
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
      ];
    } else {
      orderBy = [
        { user: { firstName: sortOrder } },
        { user: { lastName: sortOrder } },
      ];
    }

    // Only absence sort requires in-memory sort (computed from attendance). Cap fetch to limit memory.
    const shouldSortInMemory = sortBy === 'absence';
    const ABSENCE_SORT_FETCH_CAP = 1000;
    const fetchSkip = shouldSortInMemory ? 0 : skip;
    const fetchTake = shouldSortInMemory ? ABSENCE_SORT_FETCH_CAP : take;

    const [items, total, totalMonthlyFeesResult] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip: fetchSkip,
        take: fetchTake,
        orderBy,
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
      // Calculate total monthly fees using aggregate (SUM) with same filters, independent of pagination
      this.prisma.student.aggregate({
        where,
        _sum: {
          monthlyFee: true,
        },
      }),
    ]);

    const sortedItems = items;
    // In-memory sort only for absence (already ordered by DB for student/monthlyFee/register)

    // Extract total monthly fees from aggregate result
    const totalMonthlyFees = totalMonthlyFeesResult._sum?.monthlyFee 
      ? Number(totalMonthlyFeesResult._sum.monthlyFee) 
      : 0;

    // Calculate attendance data for the selected month
    // If month/year not provided, use current month
    const now = new Date();
    const selectedMonth = params?.month ?? now.getMonth() + 1; // 1-12 (January-December)
    const selectedYear = params?.year ?? now.getFullYear();
    
    // Calculate date range for the selected month
    // JavaScript Date months are 0-indexed (0-11), so we subtract 1
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    // Get the last day of the month by going to the first day of next month and subtracting 1 day
    const monthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

    // Get all student IDs from the fetched items
    const studentIds = sortedItems.map(item => item.id);

    // Calculate attendance data efficiently using aggregation
    // For each student, we need:
    // 1. Total classes = count of lessons in their group within the month
    // 2. Absences = count of attendance records marked as absent (isPresent = false) within the month
    // Note: If attendance is not marked for a session, it's not counted as absence (only explicitly marked absences count)
    
    const attendanceDataMap = new Map<string, { totalClasses: number; absences: number }>();

    if (studentIds.length > 0) {
      // Get all groups for these students
      const studentGroups = new Map<string, string | null>();
      const groupToStudents = new Map<string, string[]>(); // Map groupId to array of studentIds
      sortedItems.forEach(student => {
        studentGroups.set(student.id, student.groupId);
        if (student.groupId) {
          if (!groupToStudents.has(student.groupId)) {
            groupToStudents.set(student.groupId, []);
          }
          groupToStudents.get(student.groupId)!.push(student.id);
        }
      });

      // Get all unique group IDs
      const uniqueGroupIds = Array.from(groupToStudents.keys());

      // Fetch total classes per group in a single query (grouped by groupId)
      // Then distribute to students in those groups
      const groupClassesMap = new Map<string, number>();
      if (uniqueGroupIds.length > 0) {
        const groupClassesResults = await Promise.all(
          uniqueGroupIds.map(async (groupId) => {
            const count = await this.prisma.lesson.count({
              where: {
                groupId,
                scheduledAt: {
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
            });
            return { groupId, count };
          })
        );
        groupClassesResults.forEach(({ groupId, count }) => {
          groupClassesMap.set(groupId, count);
        });
      }

      // Fetch absences for all students in a single aggregation query
      const absencesResults = await this.prisma.attendance.groupBy({
        by: ['studentId'],
        where: {
          studentId: { in: studentIds },
          isPresent: false,
          lesson: {
            scheduledAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        },
        _count: true,
      });

      // Build absences map
      const absencesMap = new Map<string, number>();
      absencesResults.forEach((result) => {
        absencesMap.set(result.studentId, result._count);
      });

      // Combine data for each student
      studentIds.forEach((studentId) => {
        const groupId = studentGroups.get(studentId);
        const totalClasses = groupId ? (groupClassesMap.get(groupId) || 0) : 0;
        const absences = absencesMap.get(studentId) || 0;
        attendanceDataMap.set(studentId, { totalClasses, absences });
      });
    }

    // Add attendance data to each student item
    let itemsWithAttendance = sortedItems.map(student => {
      const attendance = attendanceDataMap.get(student.id) || { totalClasses: 0, absences: 0 };
      return {
        ...student,
        attendanceSummary: {
          totalClasses: attendance.totalClasses,
          absences: attendance.absences,
        },
      };
    });

    // Apply in-memory sorting for absence if needed (after attendance data is calculated)
    if (shouldSortInMemory && sortBy === 'absence') {
      itemsWithAttendance = [...itemsWithAttendance].sort((a, b) => {
        // Get absences count, treating null/0 totalClasses as 0 absences for sorting stability
        const aAbsences = (a.attendanceSummary?.totalClasses === 0 || !a.attendanceSummary?.totalClasses) 
          ? 0 
          : (a.attendanceSummary?.absences || 0);
        const bAbsences = (b.attendanceSummary?.totalClasses === 0 || !b.attendanceSummary?.totalClasses) 
          ? 0 
          : (b.attendanceSummary?.absences || 0);
        
        const comparison = aAbsences - bAbsences;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      // Apply pagination after sorting
      itemsWithAttendance = itemsWithAttendance.slice(skip, skip + take);
    }

    return {
      items: itemsWithAttendance,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
      totalMonthlyFees,
    };
  }

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
        SELECT "centerId" FROM "manager_profiles" WHERE "userId" = ${currentUserId} LIMIT 1
      `;
      const managerCenterId = managerProfile[0]?.centerId;
      if (!managerCenterId) {
        throw new ForbiddenException('Manager account is not assigned to a center');
      }
      if (student.group?.centerId !== managerCenterId) {
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

  async create(dto: CreateStudentDto, user?: JwtPayload) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const managerCenterId = getManagerCenterIdOrThrow(user);

    // Validate group if provided
    if (dto.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: dto.groupId },
        include: { _count: { select: { students: true } } },
      });

      if (!group) {
        throw new BadRequestException(`Group with ID ${dto.groupId} not found`);
      }

      if (managerCenterId && group.centerId !== managerCenterId) {
        throw new ForbiddenException('You can only create students inside your assigned center');
      }

      if (group._count.students >= FIXED_GROUP_MAX_STUDENTS) {
        throw new BadRequestException(GROUP_CAPACITY_EXCEEDED_MESSAGE);
      }
    }

    // Validate teacher if provided
    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: dto.teacherId },
        include: {
          groups: {
            select: {
              centerId: true,
            },
          },
        },
      });

      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
      }

      if (managerCenterId) {
        const teacherInManagerCenter = teacher.groups.some((group) => group.centerId === managerCenterId);
        if (!teacherInManagerCenter) {
          throw new ForbiddenException('You can only assign teachers from your center');
        }
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user and student in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
      });

      // Create student profile
      const studentCreateData: Prisma.StudentUncheckedCreateInput = {
        userId: user.id,
        groupId: dto.groupId,
        teacherId: dto.teacherId,
        parentName: dto.parentName,
        parentPhone: dto.parentPhone,
        parentEmail: dto.parentEmail,
        monthlyFee: dto.monthlyFee,
        notes: dto.notes,
        receiveReports: dto.receiveReports ?? true,
      };
      (studentCreateData as Record<string, unknown>).age = dto.age;
      (studentCreateData as Record<string, unknown>).parentPassportInfo = dto.parentPassportInfo;

      const student = await tx.student.create({
        data: studentCreateData,
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
          group: { select: { id: true, name: true } },
        },
      });

      if (dto.groupId) {
        const now = new Date();
        await tx.$executeRaw`
          INSERT INTO "student_group_histories" ("id", "studentId", "groupId", "joinedAt", "createdAt", "updatedAt")
          VALUES (${randomUUID()}, ${student.id}, ${dto.groupId}, ${now}, ${now}, ${now})
        `;
      }

      // Add to group chat if group exists
      if (dto.groupId) {
        const chat = await tx.chat.findUnique({
          where: { groupId: dto.groupId },
        });

        if (chat) {
          await tx.chatParticipant.create({
            data: {
              chatId: chat.id,
              userId: user.id,
              isAdmin: false,
            },
          });
        }
      }

      return student;
    });

    return result;
  }

  async update(id: string, dto: UpdateStudentDto, user?: JwtPayload) {
    await this.assertManagerStudentAccess(id, user?.sub, user?.role);
    const student = await this.findById(id, user?.sub, user?.role);
    const managerCenterId = getManagerCenterIdOrThrow(user);

    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: dto.teacherId },
      });

      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
      }
    }
    
    // Update user fields if provided
    if (dto.firstName || dto.lastName || dto.phone || dto.status) {
      await this.prisma.user.update({
        where: { id: student.user.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          status: dto.status,
        },
      });
    }

    // Update student fields
    const updateData: {
      age?: number;
      parentName?: string;
      parentPhone?: string;
      parentEmail?: string;
      parentPassportInfo?: string;
      monthlyFee?: number;
      notes?: string;
      receiveReports?: boolean;
      groupId?: string | null;
      teacherId?: string | null;
      registerDate?: Date | null;
    } = {
      age: dto.age,
      parentName: dto.parentName,
      parentPhone: dto.parentPhone,
      parentEmail: dto.parentEmail,
      parentPassportInfo: dto.parentPassportInfo,
      monthlyFee: dto.monthlyFee,
      notes: dto.notes,
      receiveReports: dto.receiveReports,
    };

    // When groupId is set, sync teacherId from the group so Teacher → My Students shows the student immediately
    if (dto.groupId !== undefined) {
      const newGroupId = dto.groupId?.trim() || null;
      updateData.groupId = newGroupId;
      if (newGroupId) {
        const group = await this.prisma.group.findUnique({
          where: { id: newGroupId },
          select: { teacherId: true, centerId: true },
        });
        if (!group) {
          throw new BadRequestException(`Group with ID ${newGroupId} not found`);
        }
        if (managerCenterId && group.centerId !== managerCenterId) {
          throw new ForbiddenException('You can only move students to groups in your center');
        }
        // If teacherId is also provided, ensure the group belongs to that teacher
        if (dto.teacherId !== undefined && dto.teacherId !== null && dto.teacherId !== '') {
          if (group.teacherId !== dto.teacherId) {
            throw new BadRequestException(
              'The selected group does not belong to the selected teacher. Please choose a group assigned to this teacher.',
            );
          }
        }
        if (group.teacherId) {
          updateData.teacherId = group.teacherId;
        }
      } else {
        updateData.teacherId = null;
      }
    }
    if (dto.teacherId !== undefined) {
      updateData.teacherId = dto.teacherId;
    }
    if (dto.registerDate !== undefined) {
      updateData.registerDate = dto.registerDate
        ? new Date(dto.registerDate)
        : null;
    }

    const previousGroupId = student.groupId ?? null;
    const joinedAtForNewGroup = dto.registerDate ? new Date(dto.registerDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const updatedStudent = await tx.student.update({
        where: { id },
        data: updateData,
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
          group: { 
            select: { 
              id: true, 
              name: true,
              level: true,
              center: { select: { id: true, name: true } },
            } 
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
      });

      await this.syncStudentGroupHistory(
        tx,
        id,
        previousGroupId,
        updatedStudent.groupId ?? null,
        joinedAtForNewGroup,
      );

      return updatedStudent;
    });
  }

  async delete(id: string, user?: JwtPayload) {
    await this.assertManagerStudentAccess(id, user?.sub, user?.role);
    const student = await this.findById(id, user?.sub, user?.role);

    // Delete user (cascades to student)
    await this.prisma.user.delete({
      where: { id: student.user.id },
    });

    return { success: true };
  }

  /**
   * Delete multiple students by id in a single transaction. Only ADMIN can call this.
   */
  async deleteMany(ids: string[], user?: JwtPayload) {
    if (!ids || ids.length === 0) {
      return { success: true, deleted: 0 };
    }
    const uniqueIds = [...new Set(ids)];
    if (user?.role === UserRole.MANAGER) {
      const managerCenterId = getManagerCenterIdOrThrow(user);
      if (managerCenterId) {
        const scopedStudents = await this.prisma.student.findMany({
          where: {
            id: { in: uniqueIds },
            group: { centerId: managerCenterId },
          },
          select: { id: true, userId: true },
        });

        if (scopedStudents.length !== uniqueIds.length) {
          throw new ForbiddenException('One or more students are outside your assigned center');
        }

        const scopedUserIds = scopedStudents.map((s) => s.userId);
        await this.prisma.$transaction([
          this.prisma.student.deleteMany({ where: { id: { in: scopedStudents.map((s) => s.id) } } }),
          this.prisma.user.deleteMany({ where: { id: { in: scopedUserIds } } }),
        ]);
        return { success: true, deleted: scopedStudents.length };
      }
    }

    const students = await this.prisma.student.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, userId: true },
    });
    const userIds = students.map((s) => s.userId);
    if (userIds.length === 0) {
      return { success: true, deleted: 0 };
    }
    await this.prisma.$transaction([
      this.prisma.student.deleteMany({ where: { id: { in: students.map((s) => s.id) } } }),
      this.prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);
    return { success: true, deleted: students.length };
  }
}




