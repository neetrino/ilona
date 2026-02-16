import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Constant for deduction amount per missing action (in AMD)
const DEDUCTION_PER_MISSING_ACTION = 1500;

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: UserStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { skip = 0, take = 50, search, status, sortBy, sortOrder = 'asc' } = params || {};

    const where: Prisma.TeacherWhereInput = {};
    const userWhere: Prisma.UserWhereInput = {};

    if (search) {
      userWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      userWhere.status = status;
    }

    if (Object.keys(userWhere).length > 0) {
      where.user = userWhere;
    }

    // Fetch teachers with groups
    const teachers = await this.prisma.teacher.findMany({
      where,
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
        groups: {
          take: 3,
          select: {
            id: true,
            name: true,
            level: true,
            center: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { groups: true, lessons: true },
        },
      },
    });

    // Get all teacher IDs
    const teacherIds = teachers.map(t => t.id);

    // Fetch student counts for all teachers in a single query using aggregation
    const studentCounts = await this.prisma.student.groupBy({
      by: ['groupId'],
      where: {
        group: {
          teacherId: {
            in: teacherIds,
          },
        },
      },
      _count: {
        id: true,
      },
    });

    // Get group-to-teacher mapping
    const groups = await this.prisma.group.findMany({
      where: {
        teacherId: {
          in: teacherIds,
        },
      },
      select: {
        id: true,
        teacherId: true,
      },
    });

    // Create a map of teacherId -> student count
    const teacherStudentCountMap = new Map<string, number>();
    groups.forEach(group => {
      if (group.teacherId) {
        const currentCount = teacherStudentCountMap.get(group.teacherId) || 0;
        const groupStudentCount = studentCounts.find(sc => sc.groupId === group.id)?._count.id || 0;
        teacherStudentCountMap.set(group.teacherId, currentCount + groupStudentCount);
      }
    });

    // Add student counts to teachers
    const teachersWithStudentCount = teachers.map(teacher => ({
      ...teacher,
      _count: {
        ...teacher._count,
        students: teacherStudentCountMap.get(teacher.id) || 0,
      },
    }));

    // Apply sorting
    let sortedTeachers = teachersWithStudentCount;
    if (sortBy) {
      sortedTeachers = [...teachersWithStudentCount].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'students':
            aValue = a._count.students || 0;
            bValue = b._count.students || 0;
            break;
          case 'teacher':
            aValue = `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
            bValue = `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
            break;
          case 'groups':
            aValue = a._count.groups || 0;
            bValue = b._count.groups || 0;
            break;
          case 'lessons':
            aValue = a._count.lessons || 0;
            bValue = b._count.lessons || 0;
            break;
          default:
            aValue = `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
            bValue = `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sorting by first name
      sortedTeachers = [...teachersWithStudentCount].sort((a, b) => {
        const aValue = `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
        const bValue = `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
        return aValue.localeCompare(bValue);
      });
    }

    // Fetch all unique centers for each teacher
    const teacherCentersMap = new Map<string, Array<{ id: string; name: string }>>();
    const allTeacherGroups = await this.prisma.group.findMany({
      where: {
        teacherId: {
          in: teacherIds,
        },
      },
      select: {
        id: true,
        teacherId: true,
        center: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    allTeacherGroups.forEach((group) => {
      if (group.teacherId && group.center) {
        const existing = teacherCentersMap.get(group.teacherId) || [];
        // Check if center already exists for this teacher
        if (!existing.find((c) => c.id === group.center!.id)) {
          existing.push({
            id: group.center.id,
            name: group.center.name,
          });
        }
        teacherCentersMap.set(group.teacherId, existing);
      }
    });

    // Calculate obligations, deduction, and final cost for each teacher
    // Fetch completed lessons for all teachers to calculate obligations
    const allCompletedLessons = await this.prisma.lesson.findMany({
      where: {
        teacherId: { in: teacherIds },
        status: 'COMPLETED',
      },
      select: {
        teacherId: true,
        duration: true,
        absenceMarked: true,
        feedbacksCompleted: true,
        voiceSent: true,
        textSent: true,
      },
    });

    // Calculate obligations per teacher
    const teacherObligationsMap = new Map<string, {
      completed: number;
      total: number;
      deductionAmount: number;
    }>();

    teacherIds.forEach(teacherId => {
      const teacherLessons = allCompletedLessons.filter(l => l.teacherId === teacherId);
      
      if (teacherLessons.length === 0) {
        // No lessons, show 0/4 with 0 deduction
        teacherObligationsMap.set(teacherId, {
          completed: 0,
          total: 0,
          deductionAmount: 0,
        });
      } else {
        // Calculate total obligations across all lessons
        let totalCompleted = 0;
        let totalRequired = 0;

        teacherLessons.forEach(lesson => {
          const obligations = [
            lesson.absenceMarked ?? false,
            lesson.feedbacksCompleted ?? false,
            lesson.voiceSent ?? false,
            lesson.textSent ?? false,
          ];
          
          totalRequired += 4;
          totalCompleted += obligations.filter(Boolean).length;
        });

        // Calculate average actions completed per lesson (for display as X/4)
        const avgCompletedPerLesson = Math.round(totalCompleted / teacherLessons.length);
        
        // Total missing actions across all lessons
        const missingCount = totalRequired - totalCompleted;
        const deductionAmount = missingCount * DEDUCTION_PER_MISSING_ACTION;

        teacherObligationsMap.set(teacherId, {
          completed: avgCompletedPerLesson, // Average per lesson for X/4 display
          total: 4, // Always 4 actions required
          deductionAmount,
        });
      }
    });

    // Format response to match expected structure (with obligations)
    const teachersWithObligations = sortedTeachers.map((teacher) => {
      const obligations = teacherObligationsMap.get(teacher.id) || {
        completed: 0,
        total: 0,
        deductionAmount: 0,
      };
      
      // Calculate base salary (hourly rate * total hours from completed lessons)
      const teacherLessonsWithDuration = allCompletedLessons.filter(l => l.teacherId === teacher.id);
      const totalHours = teacherLessonsWithDuration.reduce((sum, l) => sum + (l.duration || 60) / 60, 0);
      const baseSalary = totalHours * Number(teacher.hourlyRate || 0);
      
      // Final cost = base salary - deduction
      const finalCost = Math.max(0, baseSalary - obligations.deductionAmount);

      return {
        ...teacher,
        groups: teacher.groups.map((group) => ({
          id: group.id,
          name: group.name,
          level: group.level,
          center: group.center ? {
            id: group.center.id,
            name: group.center.name,
          } : undefined,
        })),
        // Add all unique centers for this teacher (from all groups, not just the first 3)
        centers: teacherCentersMap.get(teacher.id) || [],
        // Add obligation fields
        obligationsDoneCount: obligations.completed,
        obligationsTotal: 4, // Always 4 actions required
        deductionAmount: obligations.deductionAmount,
        finalCost,
      };
    });

    // Apply sorting again after adding obligation data (if sortBy is for obligation/deduction/cost)
    let finalSortedTeachers = teachersWithObligations;
    if (sortBy && ['obligation', 'deduction', 'cost'].includes(sortBy)) {
      finalSortedTeachers = [...teachersWithObligations].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'obligation':
            aValue = a.obligationsDoneCount ?? 0;
            bValue = b.obligationsDoneCount ?? 0;
            break;
          case 'deduction':
            aValue = a.deductionAmount ?? 0;
            bValue = b.deductionAmount ?? 0;
            break;
          case 'cost':
            aValue = a.finalCost ?? 0;
            bValue = b.finalCost ?? 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    const total = finalSortedTeachers.length;
    const paginatedTeachers = finalSortedTeachers.slice(skip, skip + take);
    const items = paginatedTeachers;

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
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
        groups: {
          include: {
            center: { select: { id: true, name: true } },
            _count: { select: { students: true } },
          },
        },
        _count: {
          select: { groups: true, lessons: true, feedbacks: true },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async findByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
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
        groups: {
          include: {
            center: { select: { id: true, name: true } },
            _count: { select: { students: true, lessons: true } },
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return teacher;
  }

  async create(dto: CreateTeacherDto) {
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
          workingDays: dto.workingDays ?? ['MON', 'TUE', 'WED', 'THU', 'FRI'],
          workingHours: dto.workingHours ?? undefined,
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

      return teacher;
    });

    return result;
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.findById(id);

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

    // Update teacher fields
    return this.prisma.teacher.update({
      where: { id },
      data: {
        bio: dto.bio,
        specialization: dto.specialization,
        hourlyRate: dto.hourlyRate,
        workingDays: dto.workingDays,
        workingHours: dto.workingHours,
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

  async delete(id: string) {
    const teacher = await this.findById(id);

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

  async deleteMany(ids: string[]) {
    if (!ids || ids.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Verify all teachers exist
    const teachers = await this.prisma.teacher.findMany({
      where: { id: { in: ids } },
      include: { user: true },
    });

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

  async getStatistics(id: string, dateFrom?: Date, dateTo?: Date) {
    const teacher = await this.findById(id);

    const lessonWhere: Prisma.LessonWhereInput = { teacherId: id };
    if (dateFrom || dateTo) {
      lessonWhere.scheduledAt = {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      };
    }

    // Lesson statistics
    const [totalLessons, completedLessons, cancelledLessons] = await Promise.all([
      this.prisma.lesson.count({ where: lessonWhere }),
      this.prisma.lesson.count({ where: { ...lessonWhere, status: 'COMPLETED' } }),
      this.prisma.lesson.count({ where: { ...lessonWhere, status: 'CANCELLED' } }),
    ]);

    // Vocabulary compliance
    const lessonsWithVocab = await this.prisma.lesson.count({
      where: { ...lessonWhere, status: 'COMPLETED', vocabularySent: true },
    });

    // Feedback compliance
    const feedbacksRequired = await this.prisma.lesson.count({
      where: { ...lessonWhere, status: 'COMPLETED' },
    });

    const feedbacksProvided = await this.prisma.feedback.count({
      where: {
        teacherId: id,
        lesson: lessonWhere,
      },
    });

    // Deductions
    const deductions = await this.prisma.deduction.aggregate({
      where: { teacherId: id },
      _sum: { amount: true },
      _count: true,
    });

    // Students count
    const studentsCount = await this.prisma.student.count({
      where: { group: { teacherId: id } },
    });

    return {
      lessons: {
        total: totalLessons,
        completed: completedLessons,
        cancelled: cancelledLessons,
        scheduled: totalLessons - completedLessons - cancelledLessons,
      },
      compliance: {
        vocabularyRate: completedLessons > 0 
          ? Math.round((lessonsWithVocab / completedLessons) * 100) 
          : 0,
        feedbackRate: feedbacksRequired > 0 
          ? Math.round((feedbacksProvided / feedbacksRequired) * 100) 
          : 0,
      },
      deductions: {
        count: deductions._count,
        total: deductions._sum.amount || 0,
      },
      studentsCount,
      groupsCount: teacher._count.groups,
    };
  }

  async getMyDashboard(userId: string) {
    const teacher = await this.findByUserId(userId);

    // Today's lessons
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLessons = await this.prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        scheduledAt: { gte: today, lt: tomorrow },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            _count: { select: { students: true } },
          },
        },
        _count: { select: { attendances: true, feedbacks: true } },
      },
    });

    // Upcoming lessons
    const upcomingLessons = await this.prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        scheduledAt: { gte: tomorrow },
        status: 'SCHEDULED',
      },
      take: 5,
      orderBy: { scheduledAt: 'asc' },
      include: {
        group: { select: { id: true, name: true } },
      },
    });

    // Pending tasks (lessons without feedback/vocabulary)
    const pendingFeedback = await this.prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        status: 'COMPLETED',
        feedbacksCompleted: false,
      },
      take: 5,
      orderBy: { completedAt: 'desc' },
      include: {
        group: { select: { id: true, name: true } },
      },
    });

    const pendingVocabulary = await this.prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        status: 'COMPLETED',
        vocabularySent: false,
      },
      take: 5,
      orderBy: { completedAt: 'desc' },
      include: {
        group: { select: { id: true, name: true } },
      },
    });

    // Recent deductions
    const recentDeductions = await this.prisma.deduction.findMany({
      where: { teacherId: teacher.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Statistics
    const stats = await this.getStatistics(teacher.id);

    return {
      teacher,
      todayLessons,
      upcomingLessons,
      pendingTasks: {
        feedback: pendingFeedback,
        vocabulary: pendingVocabulary,
      },
      recentDeductions,
      statistics: stats,
    };
  }

  async getDailyPlan(userId: string, date: Date) {
    const teacher = await this.findByUserId(userId);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const lessons = await this.prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        group: {
          include: {
            center: { select: { id: true, name: true } },
            students: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
              },
            },
          },
        },
        attendances: true,
        feedbacks: true,
      },
    });

    return {
      date,
      teacher: {
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      },
      lessons: lessons.map((lesson: typeof lessons[0]) => ({
        ...lesson,
        attendanceStatus: {
          total: lesson.group.students.length,
          marked: lesson.attendances.length,
        },
        feedbackStatus: {
          total: lesson.group.students.length,
          completed: lesson.feedbacks.length,
        },
      })),
    };
  }
}
