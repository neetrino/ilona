import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { Prisma, UserRole, UserStatus } from '@ilona/database';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';

// Constant for deduction amount per missing action (in AMD)
const DEDUCTION_PER_MISSING_ACTION = 1500;

@Injectable()
export class TeacherCrudService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertManagerTeacherAccess(teacherId: string, currentUser?: JwtPayload) {
    const managerCenterId = getManagerCenterIdOrThrow(currentUser);
    if (!managerCenterId) return;

    const teacherInCenter = await this.prisma.group.findFirst({
      where: {
        teacherId,
        centerId: managerCenterId,
      },
      select: { id: true },
    });

    if (!teacherInCenter) {
      throw new ForbiddenException('You do not have access to this teacher');
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: UserStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    currentUser?: JwtPayload;
  }) {
    const { skip = 0, take = 50, search, status, sortBy, sortOrder = 'asc', currentUser } = params || {};

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

    const managerCenterId = getManagerCenterIdOrThrow(currentUser);
    if (managerCenterId) {
      where.groups = {
        some: {
          centerId: managerCenterId,
        },
      };
    }

    const total = await this.prisma.teacher.count({ where });

    // Sort options that can be expressed in DB: teacher name, groups count, lessons count
    const dbSortOptions = ['teacher', 'groups', 'lessons'];
    const useDbSort = !sortBy || dbSortOptions.includes(sortBy);

    const orderBy: Prisma.TeacherOrderByWithRelationInput | Prisma.TeacherOrderByWithRelationInput[] = useDbSort
      ? sortBy === 'groups'
        ? [{ groups: { _count: sortOrder } }]
        : sortBy === 'lessons'
          ? [{ lessons: { _count: sortOrder } }]
          : [
              { user: { firstName: sortOrder } },
              { user: { lastName: sortOrder } },
            ]
      : [{ user: { firstName: 'asc' } }, { user: { lastName: 'asc' } }];

    const fetchSkip = useDbSort ? skip : 0;
    const fetchTake = useDbSort ? take : undefined;

    // Fetch teachers with groups (with skip/take when using DB sort)
    const teachers = await this.prisma.teacher.findMany({
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

    // Apply in-memory sorting only when sort is by students/obligation/deduction/cost (not DB-expressible)
    let sortedTeachers = teachersWithStudentCount;
    if (!useDbSort && sortBy) {
      sortedTeachers = [...teachersWithStudentCount].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

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
    } else if (!useDbSort) {
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
        if (!existing.find((c) => c.id === group.center.id)) {
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
      
      // Calculate base salary (per lesson, not per hour)
      const teacherLessons = allCompletedLessons.filter(l => l.teacherId === teacher.id);
      const lessonsCount = teacherLessons.length;
      // Use lessonRateAMD if set, otherwise fall back to hourlyRate (assuming 1 hour = 1 lesson)
      const lessonRate = teacher.lessonRateAMD 
        ? Number(teacher.lessonRateAMD) 
        : Number(teacher.hourlyRate || 0);
      const baseSalary = lessonsCount * lessonRate;
      
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
    if (!useDbSort && sortBy && ['obligation', 'deduction', 'cost'].includes(sortBy)) {
      finalSortedTeachers = [...teachersWithObligations].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

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

    const paginatedTeachers = useDbSort ? finalSortedTeachers : finalSortedTeachers.slice(skip, skip + take);
    const items = paginatedTeachers;

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(id: string, currentUser?: JwtPayload) {
    await this.assertManagerTeacherAccess(id, currentUser);

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

  async update(id: string, dto: UpdateTeacherDto, currentUser?: JwtPayload) {
    const teacher = await this.findById(id, currentUser);

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
        lessonRateAMD: dto.lessonRateAMD,
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

  async delete(id: string, currentUser?: JwtPayload) {
    const teacher = await this.findById(id, currentUser);

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






