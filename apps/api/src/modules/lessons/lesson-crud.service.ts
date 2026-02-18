import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto } from './dto';
import { Prisma, LessonStatus, UserRole } from '@prisma/client';
import { LessonEnrichmentService } from './lesson-enrichment.service';

/**
 * Service responsible for lesson CRUD operations
 */
@Injectable()
export class LessonCrudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichmentService: LessonEnrichmentService,
  ) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    groupId?: string;
    teacherId?: string;
    status?: LessonStatus;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    currentUserId?: string;
    userRole?: UserRole;
  }) {
    const { skip = 0, take = 50, groupId, teacherId, status, dateFrom, dateTo, sortBy, sortOrder, currentUserId, userRole } = params || {};

    const where: Prisma.LessonWhereInput = {};

    // Role-based scoping: Teachers can only see their own lessons
    let teacherScopeCondition: Prisma.LessonWhereInput | null = null;
    let currentTeacherId: string | null = null;
    
    if (userRole === UserRole.TEACHER && currentUserId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });

      if (teacher) {
        currentTeacherId = teacher.id;
        // Include lessons where teacher is directly assigned OR where teacher is assigned to the group
        teacherScopeCondition = {
          OR: [
            { teacherId: teacher.id },
            {
              group: {
                teacherId: teacher.id,
              },
            },
          ],
        };
      } else {
        // Teacher not found, return empty result
        return {
          items: [],
          total: 0,
          page: 1,
          pageSize: take,
          totalPages: 0,
        };
      }
    }

    // Build filter conditions
    const filterConditions: Prisma.LessonWhereInput[] = [];

    // Add teacher scope condition if applicable
    if (teacherScopeCondition) {
      filterConditions.push(teacherScopeCondition);
    }

    // Admin can see all lessons, but can still filter
    const additionalFilters: Prisma.LessonWhereInput = {};
    if (groupId) additionalFilters.groupId = groupId;
    if (teacherId) {
      // For teachers, ensure they can only query their own teacherId
      if (userRole === UserRole.TEACHER && currentTeacherId && teacherId !== currentTeacherId) {
        throw new ForbiddenException('You can only view your own lessons');
      }
      additionalFilters.teacherId = teacherId;
    }
    if (status) additionalFilters.status = status;

    if (dateFrom || dateTo) {
      additionalFilters.scheduledAt = {};
      if (dateFrom) additionalFilters.scheduledAt.gte = dateFrom;
      if (dateTo) additionalFilters.scheduledAt.lte = dateTo;
    }

    // Combine all conditions with AND
    if (filterConditions.length > 0 || Object.keys(additionalFilters).length > 0) {
      if (filterConditions.length > 0 && Object.keys(additionalFilters).length > 0) {
        where.AND = [...filterConditions, additionalFilters];
      } else if (filterConditions.length > 0) {
        Object.assign(where, filterConditions[0]);
      } else {
        Object.assign(where, additionalFilters);
      }
    }

    // Build orderBy clause
    let orderBy: Prisma.LessonOrderByWithRelationInput;
    if (sortBy === 'scheduledAt' || sortBy === 'dateTime') {
      orderBy = { scheduledAt: sortOrder || 'desc' };
    } else {
      // Default to scheduledAt desc if no valid sortBy
      orderBy = { scheduledAt: 'desc' };
    }

    const [items, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          group: {
            select: {
              id: true,
              name: true,
              level: true,
              center: { select: { id: true, name: true } },
            },
          },
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              attendances: true,
              feedbacks: true,
            },
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    // Enrich lessons with computed fields
    const enrichedItems = items.map((lesson) => this.enrichmentService.enrichLesson(lesson));

    return {
      items: enrichedItems,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(
    id: string,
    currentUserId?: string,
    userRole?: UserRole,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            center: true,
            students: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        attendances: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        feedbacks: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    // Role-based authorization: Teachers can only access their own lessons
    if (userRole === UserRole.TEACHER && currentUserId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });

      if (teacher) {
        // Check if teacher is assigned to this lesson (directly or via group)
        const isAssigned =
          lesson.teacherId === teacher.id || lesson.group.teacherId === teacher.id;

        if (!isAssigned) {
          throw new ForbiddenException('You do not have access to this lesson');
        }
      } else {
        throw new ForbiddenException('Teacher profile not found');
      }
    }

    // Enrich lesson with computed fields
    return this.enrichmentService.enrichLesson(lesson);
  }

  async findByTeacher(teacherId: string, dateFrom?: Date, dateTo?: Date) {
    // Include lessons where teacher is directly assigned OR where teacher is assigned to the group
    const where: Prisma.LessonWhereInput = {
      OR: [
        { teacherId },
        {
          group: {
            teacherId,
          },
        },
      ],
    };

    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) where.scheduledAt.gte = dateFrom;
      if (dateTo) where.scheduledAt.lte = dateTo;
    }

    const lessons = await this.prisma.lesson.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            center: { select: { id: true, name: true } },
            _count: { select: { students: true } },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { attendances: true, feedbacks: true },
        },
      },
    });

    // Return in the same format as findAll for consistency
    return {
      items: lessons,
      total: lessons.length,
      page: 1,
      pageSize: lessons.length,
      totalPages: 1,
    };
  }

  async getTodayLessons(teacherId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.findByTeacher(teacherId, today, tomorrow);
  }

  async getUpcoming(teacherId: string, limit = 10) {
    const now = new Date();

    return this.prisma.lesson.findMany({
      where: {
        teacherId,
        scheduledAt: { gte: now },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      take: limit,
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
      },
    });
  }

  async create(dto: CreateLessonDto) {
    // Validate group
    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
    });

    if (!group) {
      throw new BadRequestException(`Group with ID ${dto.groupId} not found`);
    }

    // Validate teacher
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
    }

    // Allow creating lessons even if they already exist (user can create lessons whenever they want)
    // Removed time conflict check to allow duplicate lessons

    return this.prisma.lesson.create({
      data: {
        groupId: dto.groupId,
        teacherId: dto.teacherId,
        scheduledAt: new Date(dto.scheduledAt),
        duration: dto.duration ?? 60,
        topic: dto.topic,
        description: dto.description,
        status: 'SCHEDULED',
      },
      include: {
        group: { select: { id: true, name: true } },
        teacher: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async createBulk(lessons: CreateLessonDto[]) {
    const created = await Promise.all(lessons.map((dto) => this.create(dto)));
    return created;
  }

  async update(id: string, dto: UpdateLessonDto, userId?: string, userRole?: UserRole) {
    const lesson = await this.findById(id);

    // For teachers, check authorization: they can only edit their own lessons
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        include: { groups: { select: { id: true } } },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      // Check if teacher is assigned to this lesson
      const isAssignedToLesson = lesson.teacherId === teacher.id;
      // Check if teacher is assigned to the lesson's group
      const isAssignedToGroup = teacher.groups.some((g) => g.id === lesson.groupId);

      if (!isAssignedToLesson && !isAssignedToGroup) {
        throw new ForbiddenException('You can only edit lessons assigned to you or your groups');
      }
    }

    // Validate endTime > startTime
    // Use updated values if provided, otherwise use existing lesson values
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(lesson.scheduledAt);
    const duration = dto.duration !== undefined ? dto.duration : lesson.duration;
    
    if (duration <= 0) {
      throw new BadRequestException('Duration must be greater than 0');
    }
    
    const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);
    if (endTime <= scheduledAt) {
      throw new BadRequestException('End time must be after start time');
    }

    // Allow updates to completed lessons for notes, topic, description
    // but prevent changing scheduledAt or duration for completed lessons
    if (lesson.status === 'COMPLETED') {
      if (dto.scheduledAt || dto.duration !== undefined) {
        throw new BadRequestException('Cannot change scheduledAt or duration for completed lesson');
      }
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        duration: dto.duration,
        topic: dto.topic,
        description: dto.description,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string) {
    // Allow deletion of any lesson regardless of status
    return this.prisma.lesson.delete({
      where: { id },
    });
  }

  async deleteBulk(lessonIds: string[], currentUserId?: string, userRole?: UserRole) {
    // Validate input
    if (!lessonIds || !Array.isArray(lessonIds) || lessonIds.length === 0) {
      throw new BadRequestException('lessonIds must be a non-empty array');
    }

    // For teachers, validate ownership of all lessons
    let currentTeacherId: string | null = null;
    if (userRole === UserRole.TEACHER && currentUserId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      currentTeacherId = teacher.id;

      // Check that all lessons belong to this teacher
      const lessons = await this.prisma.lesson.findMany({
        where: {
          id: { in: lessonIds },
        },
        select: {
          id: true,
          teacherId: true,
          status: true,
        },
      });

      // Check if all requested lessons exist
      const foundIds = new Set(lessons.map((l) => l.id));
      const missingIds = lessonIds.filter((id) => !foundIds.has(id));
      if (missingIds.length > 0) {
        throw new NotFoundException(`Lessons not found: ${missingIds.join(', ')}`);
      }

      // Check ownership
      const unauthorizedLessons = lessons.filter((l) => l.teacherId !== currentTeacherId);
      if (unauthorizedLessons.length > 0) {
        throw new ForbiddenException(
          `You don't have permission to delete ${unauthorizedLessons.length} lesson(s)`,
        );
      }
    } else if (userRole === UserRole.ADMIN) {
      // Admin can delete any lessons
      const lessons = await this.prisma.lesson.findMany({
        where: {
          id: { in: lessonIds },
        },
        select: {
          id: true,
        },
      });

      const foundIds = new Set(lessons.map((l) => l.id));
      const missingIds = lessonIds.filter((id) => !foundIds.has(id));
      if (missingIds.length > 0) {
        throw new NotFoundException(`Lessons not found: ${missingIds.join(', ')}`);
      }
    } else {
      throw new ForbiddenException('You do not have permission to delete lessons');
    }

    // Delete lessons (cascade will handle attendance and feedback records)
    const result = await this.prisma.lesson.deleteMany({
      where: {
        id: { in: lessonIds },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
    };
  }
}

