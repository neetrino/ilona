import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentCrudService {
  constructor(private readonly prisma: PrismaService) {}

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
  }) {
    const { skip = 0, take = 50, search, groupId, groupIds, status, statusIds, teacherId, teacherIds, centerId, centerIds, sortBy, sortOrder = 'asc' } = params || {};

    const where: Prisma.StudentWhereInput = {};
    const userWhere: Prisma.UserWhereInput = {};

    if (search) {
      userWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
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

    // Support both single groupId (backward compatibility) and groupIds array
    if (groupIds && groupIds.length > 0) {
      where.groupId = { in: groupIds };
    } else if (groupId) {
      where.groupId = groupId;
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
    // For 'student' and 'absence' sorting, we'll sort in JavaScript after fetching
    let orderBy: Prisma.StudentOrderByWithRelationInput | Prisma.StudentOrderByWithRelationInput[];
    if (sortBy === 'student') {
      // For student name sorting, we'll sort by full name in JavaScript
      // So we fetch with default order first
      orderBy = [
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
      ];
    } else if (sortBy === 'monthlyFee') {
      // Sort by monthly fee
      orderBy = { monthlyFee: sortOrder };
    } else if (sortBy === 'absence') {
      // For absence sorting, we'll sort by absences count in JavaScript after calculating attendance
      // So we fetch with default order first
      orderBy = [
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
      ];
    } else {
      // Default sorting by firstName, then lastName
      orderBy = [
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
      ];
    }

    // For student name and absence sorting, we need to fetch all matching records, sort them, then paginate
    // For other sorts, we can use database-level sorting with pagination
    const shouldSortInMemory = sortBy === 'student' || sortBy === 'absence';
    
    const fetchSkip = shouldSortInMemory ? 0 : skip;
    const fetchTake = shouldSortInMemory ? undefined : take;

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

    // Apply in-memory sorting for student name if needed
    let sortedItems = items;
    if (shouldSortInMemory && sortBy === 'student') {
      sortedItems = [...items].sort((a, b) => {
        const aValue = `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
        const bValue = `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      // Apply pagination after sorting
      sortedItems = sortedItems.slice(skip, skip + take);
    }

    // Extract total monthly fees from aggregate result
    const totalMonthlyFees = totalMonthlyFeesResult._sum.monthlyFee 
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

    return student;
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

  async create(dto: CreateStudentDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Validate group if provided
    if (dto.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: dto.groupId },
        include: { _count: { select: { students: true } } },
      });

      if (!group) {
        throw new BadRequestException(`Group with ID ${dto.groupId} not found`);
      }

      if (group._count.students >= group.maxStudents) {
        throw new BadRequestException('Group is full');
      }
    }

    // Validate teacher if provided
    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: dto.teacherId },
      });

      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
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
      const student = await tx.student.create({
        data: {
          userId: user.id,
          groupId: dto.groupId,
          teacherId: dto.teacherId,
          parentName: dto.parentName,
          parentPhone: dto.parentPhone,
          parentEmail: dto.parentEmail,
          monthlyFee: dto.monthlyFee,
          notes: dto.notes,
          receiveReports: dto.receiveReports ?? true,
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
          group: { select: { id: true, name: true } },
        },
      });

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

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.findById(id);

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
    const updateData: any = {
      parentName: dto.parentName,
      parentPhone: dto.parentPhone,
      parentEmail: dto.parentEmail,
      monthlyFee: dto.monthlyFee,
      notes: dto.notes,
      receiveReports: dto.receiveReports,
    };
    
    // Only include these fields if provided
    if (dto.groupId !== undefined) {
      updateData.groupId = dto.groupId;
    }
    if (dto.teacherId !== undefined) {
      updateData.teacherId = dto.teacherId;
    }
    
    return this.prisma.student.update({
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
  }

  async delete(id: string) {
    const student = await this.findById(id);

    // Delete user (cascades to student)
    await this.prisma.user.delete({
      where: { id: student.user.id },
    });

    return { success: true };
  }
}




