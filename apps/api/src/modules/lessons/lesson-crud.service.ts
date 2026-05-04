import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto } from './dto';
import { Prisma, LessonStatus, UserRole } from '@ilona/database';
import { LessonEnrichmentService } from './lesson-enrichment.service';
import { SalariesService } from '../finance/salaries.service';
import {
  teacherActsAsLessonInstructor,
  lessonsPayableToTeacherWhere,
} from '../../common/lesson-instructor';

/**
 * Service responsible for lesson CRUD operations
 */
@Injectable()
export class LessonCrudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichmentService: LessonEnrichmentService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
  ) {}

  private async getManagerCenterId(currentUserId?: string, userRole?: UserRole): Promise<string | null> {
    if (userRole !== UserRole.MANAGER || !currentUserId) {
      return null;
    }

    const managerProfile = await this.prisma.$queryRaw<Array<{ centerId: string }>>`
      SELECT "centerId" FROM "manager_profiles" WHERE "userId" = ${currentUserId} LIMIT 1
    `;

    const managerCenterId = managerProfile[0]?.centerId;
    if (!managerCenterId) {
      throw new ForbiddenException('Manager account is not assigned to a center');
    }

    return managerCenterId;
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    centerId?: string;
    groupId?: string;
    groupIds?: string[];
    teacherId?: string;
    status?: LessonStatus;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    currentUserId?: string;
    userRole?: UserRole;
  }) {
    const {
      skip = 0,
      take = 50,
      centerId: centerIdParam,
      groupId,
      groupIds,
      teacherId,
      status,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      search,
      currentUserId,
      userRole,
    } = params || {};

    const where: Prisma.LessonWhereInput = {};

    // Role-based scoping: Teachers can only see their own lessons
    let roleScopeCondition: Prisma.LessonWhereInput | null = null;
    let currentTeacherId: string | null = null;
    
    if (userRole === UserRole.TEACHER && currentUserId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });

      if (teacher) {
        currentTeacherId = teacher.id;
        roleScopeCondition = {
          OR: [
            { teacherId: teacher.id, substituteTeacherId: null },
            { substituteTeacherId: teacher.id },
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

    if (userRole === UserRole.MANAGER && currentUserId) {
      const managerCenterId = await this.getManagerCenterId(currentUserId, userRole);
      if (managerCenterId) {
        roleScopeCondition = {
          group: {
            centerId: managerCenterId,
          },
        };
      }
    }

    if (userRole === UserRole.STUDENT && currentUserId) {
      const student = await this.prisma.student.findUnique({
        where: { userId: currentUserId },
        select: { id: true, groupId: true },
      });
      if (!student?.groupId) {
        return {
          items: [],
          total: 0,
          page: 1,
          pageSize: take,
          totalPages: 0,
        };
      }
      roleScopeCondition = { groupId: student.groupId };
    }

    // Build filter conditions
    const filterConditions: Prisma.LessonWhereInput[] = [];

    // Add teacher scope condition if applicable
    if (roleScopeCondition) {
      filterConditions.push(roleScopeCondition);
    }

    const additionalFilters: Prisma.LessonWhereInput = {};
    // Group / center filters (never trust client for role scope; manager/student/teacher scoping is applied above)
    if (userRole === UserRole.ADMIN) {
      if (centerIdParam) {
        const groupIs: Prisma.GroupWhereInput = { centerId: centerIdParam };
        if (groupIds && groupIds.length > 0) {
          groupIs.id = { in: groupIds };
        } else if (groupId) {
          groupIs.id = groupId;
        }
        additionalFilters.group = { is: groupIs };
      } else {
        if (groupIds && groupIds.length > 0) {
          additionalFilters.groupId = { in: groupIds };
        } else if (groupId) {
          additionalFilters.groupId = groupId;
        }
      }
    } else if (userRole !== UserRole.STUDENT) {
      if (groupIds && groupIds.length > 0) {
        additionalFilters.groupId = { in: groupIds };
      } else if (groupId) {
        additionalFilters.groupId = groupId;
      }
    }
    if (teacherId) {
      if (userRole === UserRole.TEACHER && currentTeacherId && teacherId !== currentTeacherId) {
        throw new ForbiddenException('You can only view your own lessons');
      }
      if (userRole !== UserRole.TEACHER) {
        additionalFilters.OR = [
          { teacherId },
          { substituteTeacherId: teacherId },
        ];
      }
    }
    if (status) additionalFilters.status = status;

    if (dateFrom || dateTo) {
      additionalFilters.scheduledAt = {};
      if (dateFrom) additionalFilters.scheduledAt.gte = dateFrom;
      if (dateTo) additionalFilters.scheduledAt.lte = dateTo;
    }

    // Search query - search in group name, topic, teacher name
    if (search && search.trim()) {
      const searchTerm = search.trim();
      additionalFilters.OR = [
        { topic: { contains: searchTerm, mode: 'insensitive' } },
        { group: { name: { contains: searchTerm, mode: 'insensitive' } } },
        {
          teacher: {
            user: {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
        },
        {
          substituteTeacher: {
            user: {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
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
          substituteTeacher: {
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
          dailyPlan: {
            select: { id: true },
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
    const managerCenterId = await this.getManagerCenterId(currentUserId, userRole);
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
        substituteTeacher: {
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
        dailyPlan: {
          select: { id: true },
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
        if (!teacherActsAsLessonInstructor(lesson, teacher.id)) {
          throw new ForbiddenException('You do not have access to this lesson');
        }
      } else {
        throw new ForbiddenException('Teacher profile not found');
      }
    }

    if (userRole === UserRole.STUDENT && currentUserId) {
      const student = await this.prisma.student.findUnique({
        where: { userId: currentUserId },
        select: { groupId: true },
      });
      if (!student?.groupId) {
        throw new ForbiddenException('You do not have access to this lesson');
      }
      if (lesson.groupId !== student.groupId) {
        throw new ForbiddenException('You do not have access to this lesson');
      }
    }

    if (managerCenterId && lesson.group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this lesson');
    }

    // Enrich lesson with computed fields
    return this.enrichmentService.enrichLesson(lesson);
  }

  async findByTeacher(teacherId: string, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.LessonWhereInput = {
      ...lessonsPayableToTeacherWhere(teacherId),
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
        substituteTeacher: {
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
        dailyPlan: {
          select: { id: true },
        },
      },
    });

    // Return in the same format as findAll for consistency
    const enrichedItems = lessons.map((lesson) => this.enrichmentService.enrichLesson(lesson));
    return {
      items: enrichedItems,
      total: enrichedItems.length,
      page: 1,
      pageSize: enrichedItems.length,
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
        ...lessonsPayableToTeacherWhere(teacherId),
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

  async create(dto: CreateLessonDto, currentUserId?: string, userRole?: UserRole) {
    const managerCenterId = await this.getManagerCenterId(currentUserId, userRole);

    // Phase 9: teachers cannot back-date lessons. This blocks artificial
    // inflation of salary calculations. Admins/managers may still create
    // past-dated lessons (e.g. data correction, system override).
    if (userRole === UserRole.TEACHER && dto.scheduledAt) {
      const scheduled = new Date(dto.scheduledAt);
      if (!Number.isNaN(scheduled.getTime()) && scheduled.getTime() < Date.now()) {
        throw new ForbiddenException(
          'Teachers cannot create lessons in the past. Ask an admin to add it for you.',
        );
      }
    }

    // Validate group
    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
    });

    if (!group) {
      throw new BadRequestException(`Group with ID ${dto.groupId} not found`);
    }

    if (managerCenterId && group.centerId !== managerCenterId) {
      throw new ForbiddenException('You can only create lessons inside your center');
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

  async createBulk(lessons: CreateLessonDto[], currentUserId?: string, userRole?: UserRole) {
    if (lessons.length === 0) {
      return [];
    }
    return Promise.all(lessons.map((dto) => this.create(dto, currentUserId, userRole)));
  }

  async update(id: string, dto: UpdateLessonDto, userId?: string, userRole?: UserRole) {
    const lesson = await this.findById(id, userId, userRole);

    if (userRole === UserRole.TEACHER && dto.substituteTeacherId !== undefined) {
      throw new ForbiddenException('Only administrators can assign substitute teachers');
    }

    // For teachers, check authorization: they can only edit their own lessons
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      if (!teacherActsAsLessonInstructor(lesson, teacher.id)) {
        throw new ForbiddenException('You can only edit your own lessons');
      }

      // Phase 9: teachers cannot move a lesson into the past, nor can
      // they reschedule a lesson whose original time is already in the
      // past. Admin overrides bypass this restriction.
      const originalScheduled = new Date(lesson.scheduledAt).getTime();
      if (originalScheduled < Date.now()) {
        const onlyMetadataChange =
          dto.scheduledAt === undefined && dto.duration === undefined;
        if (!onlyMetadataChange) {
          throw new ForbiddenException(
            'Past lessons are locked for teachers. Only an admin can reschedule them.',
          );
        }
      }
      if (dto.scheduledAt) {
        const next = new Date(dto.scheduledAt).getTime();
        if (!Number.isNaN(next) && next < Date.now()) {
          throw new ForbiddenException('Teachers cannot move a lesson to a past time.');
        }
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

    let nextSubstituteId: string | null | undefined;
    if (dto.substituteTeacherId !== undefined) {
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
        throw new ForbiddenException('Only administrators can assign substitute teachers');
      }
      const prevSub = lesson.substituteTeacherId ?? null;
      const raw = dto.substituteTeacherId;
      nextSubstituteId = raw === '' || raw === undefined ? null : raw;
      if (nextSubstituteId === lesson.teacherId) {
        throw new BadRequestException('Substitute teacher cannot be the same as the main teacher');
      }
      if (nextSubstituteId) {
        const sub = await this.prisma.teacher.findUnique({
          where: { id: nextSubstituteId },
          select: { id: true },
        });
        if (!sub) {
          throw new BadRequestException(`Substitute teacher with ID ${nextSubstituteId} not found`);
        }
      }
      if (nextSubstituteId !== prevSub) {
        const month = new Date(lesson.scheduledAt);
        const recalc = (tid: string) =>
          this.salariesService.recalculateSalaryForMonth(tid, month).catch(() => undefined);
        await Promise.all([
          recalc(lesson.teacherId),
          ...(prevSub ? [recalc(prevSub)] : []),
          ...(nextSubstituteId && nextSubstituteId !== prevSub ? [recalc(nextSubstituteId)] : []),
        ]);
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
        ...(nextSubstituteId !== undefined ? { substituteTeacherId: nextSubstituteId } : {}),
      },
      include: {
        group: { select: { id: true, name: true, centerId: true } },
        teacher: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        substituteTeacher: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        dailyPlan: { select: { id: true } },
      },
    }).then((row) => this.enrichmentService.enrichLesson(row));
  }

  /**
   * Set or clear substitute for all non-cancelled lessons of a group on a calendar day (UTC date string YYYY-MM-DD).
   */
  async setSubstituteForGroupDay(
    params: { groupId: string; date: string; substituteTeacherId: string | null },
    userId: string | undefined,
    userRole: UserRole | undefined,
  ) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Only administrators can assign substitute teachers');
    }

    const managerCenterId = await this.getManagerCenterId(userId, userRole);
    const group = await this.prisma.group.findUnique({
      where: { id: params.groupId },
      select: { id: true, centerId: true, teacherId: true },
    });
    if (!group) {
      throw new BadRequestException(`Group with ID ${params.groupId} not found`);
    }
    if (managerCenterId && group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this group');
    }

    const dayStart = new Date(`${params.date}T00:00:00.000Z`);
    if (Number.isNaN(dayStart.getTime())) {
      throw new BadRequestException('Invalid date. Use YYYY-MM-DD');
    }
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    let nextSub: string | null =
      params.substituteTeacherId === '' || params.substituteTeacherId === undefined
        ? null
        : params.substituteTeacherId;

    if (!group.teacherId) {
      throw new BadRequestException('Group has no main teacher; assign a teacher to the group first');
    }
    if (nextSub === group.teacherId) {
      throw new BadRequestException('Substitute teacher cannot be the same as the main teacher');
    }
    if (nextSub) {
      const sub = await this.prisma.teacher.findUnique({
        where: { id: nextSub },
        select: { id: true },
      });
      if (!sub) {
        throw new BadRequestException(`Substitute teacher with ID ${nextSub} not found`);
      }
    }

    const lessons = await this.prisma.lesson.findMany({
      where: {
        groupId: params.groupId,
        scheduledAt: { gte: dayStart, lt: dayEnd },
        status: { not: LessonStatus.CANCELLED },
      },
      select: { id: true, teacherId: true, substituteTeacherId: true, scheduledAt: true },
    });

    if (nextSub && lessons.some((l) => l.teacherId === nextSub)) {
      throw new BadRequestException('Substitute cannot be the main teacher for one of these lessons');
    }

    const recalcPairs = new Map<string, { teacherId: string; month: Date }>();
    const addRecalc = (teacherId: string, scheduledAt: Date) => {
      const month = new Date(Date.UTC(scheduledAt.getUTCFullYear(), scheduledAt.getUTCMonth(), 1));
      const key = `${teacherId}|${month.toISOString()}`;
      recalcPairs.set(key, { teacherId, month });
    };

    for (const l of lessons) {
      const prevSub = l.substituteTeacherId ?? null;
      if (nextSub !== prevSub) {
        addRecalc(l.teacherId, l.scheduledAt);
        if (prevSub) addRecalc(prevSub, l.scheduledAt);
        if (nextSub) addRecalc(nextSub, l.scheduledAt);
      }
    }

    await this.prisma.lesson.updateMany({
      where: {
        groupId: params.groupId,
        scheduledAt: { gte: dayStart, lt: dayEnd },
        status: { not: LessonStatus.CANCELLED },
      },
      data: { substituteTeacherId: nextSub },
    });

    await Promise.all(
      [...recalcPairs.values()].map(({ teacherId, month }) =>
        this.salariesService.recalculateSalaryForMonth(teacherId, month).catch(() => undefined),
      ),
    );

    return { updatedCount: lessons.length, lessonIds: lessons.map((l) => l.id) };
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
          substituteTeacherId: true,
          status: true,
        },
      });

      // Check if all requested lessons exist
      const foundIds = new Set(lessons.map((l) => l.id));
      const missingIds = lessonIds.filter((id) => !foundIds.has(id));
      if (missingIds.length > 0) {
        throw new NotFoundException(`Lessons not found: ${missingIds.join(', ')}`);
      }

      // Check ownership (main teacher without substitute, or substitute teacher)
      const unauthorizedLessons = lessons.filter(
        (l) => !teacherActsAsLessonInstructor(l, currentTeacherId!),
      );
      if (unauthorizedLessons.length > 0) {
        throw new ForbiddenException(
          `You don't have permission to delete ${unauthorizedLessons.length} lesson(s)`,
        );
      }
    } else if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
      // Admin can delete any lessons
      const managerCenterId =
        userRole === UserRole.MANAGER
          ? await this.getManagerCenterId(currentUserId, userRole)
          : null;

      const lessons = await this.prisma.lesson.findMany({
        where: {
          id: { in: lessonIds },
          ...(managerCenterId
            ? {
                group: {
                  centerId: managerCenterId,
                },
              }
            : {}),
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




