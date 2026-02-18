import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto, CompleteLessonDto } from './dto';
import { Prisma, LessonStatus, UserRole } from '@prisma/client';
import { SalariesService } from '../finance/salaries.service';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
  ) {}

  /**
   * Computes if a lesson is locked for teacher editing (midnight lock rule)
   * A lesson is locked if the current date is after the lesson's date
   */
  private isLockedForTeacher(lessonDate: Date): boolean {
    const now = new Date();
    const lessonDay = new Date(lessonDate);
    lessonDay.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    return today > lessonDay;
  }

  /**
   * Computes if a lesson has ended (end time < now)
   */
  private isLessonPast(scheduledAt: Date, duration: number): boolean {
    const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);
    return endTime < new Date();
  }

  /**
   * Computes if all required actions are completed
   */
  private areActionsComplete(lesson: {
    absenceMarked: boolean;
    feedbacksCompleted: boolean;
    voiceSent: boolean;
    textSent: boolean;
  }): boolean {
    return lesson.absenceMarked && lesson.feedbacksCompleted && lesson.voiceSent && lesson.textSent;
  }

  /**
   * Computes the completion status for a past lesson
   * Returns 'DONE' if actions are complete or locked, 'IN_PROCESS' otherwise
   */
  private getCompletionStatus(
    lesson: {
      scheduledAt: Date;
      duration: number;
      absenceMarked: boolean;
      feedbacksCompleted: boolean;
      voiceSent: boolean;
      textSent: boolean;
    },
  ): 'DONE' | 'IN_PROCESS' | null {
    const isPast = this.isLessonPast(lesson.scheduledAt, lesson.duration);
    if (!isPast) {
      return null; // Future lessons don't have completion status
    }

    const actionsComplete = this.areActionsComplete(lesson);
    const actionsLocked = this.isLockedForTeacher(lesson.scheduledAt);

    if (actionsComplete || actionsLocked) {
      return 'DONE';
    }
    return 'IN_PROCESS';
  }

  /**
   * Determines if an action should be locked (red X)
   * Priority:
   * 1. If action is completed → not locked (green checkmark)
   * 2. Else if lesson is manually completed → locked (red X)
   * 3. Else if lesson day has passed (00:00) → locked (red X)
   * 4. Else → not locked (gray X, editable)
   */
  private isActionLocked(
    actionCompleted: boolean,
    lessonStatus: LessonStatus,
    _completedAt: Date | null | undefined,
    scheduledAt: Date,
  ): boolean {
    // If action is completed, it's not locked (shows green checkmark)
    if (actionCompleted) {
      return false;
    }

    // If lesson is manually marked as completed, lock all unfinished actions
    // Check status first - if COMPLETED, lock regardless of completedAt (it should always exist but be defensive)
    if (lessonStatus === 'COMPLETED') {
      return true;
    }

    // If lesson day has passed (00:00), lock unfinished actions
    return this.isLockedForTeacher(scheduledAt);
  }

  /**
   * Enriches lesson with computed fields
   */
  private enrichLesson(lesson: any) {
    const completionStatus = this.getCompletionStatus({
      scheduledAt: lesson.scheduledAt,
      duration: lesson.duration,
      absenceMarked: lesson.absenceMarked,
      feedbacksCompleted: lesson.feedbacksCompleted,
      voiceSent: lesson.voiceSent,
      textSent: lesson.textSent,
    });

    return {
      ...lesson,
      isLockedForTeacher: this.isLockedForTeacher(lesson.scheduledAt),
      completionStatus,
      // Action lock states (for red X indicators)
      isAbsenceLocked: this.isActionLocked(
        lesson.absenceMarked || false,
        lesson.status,
        lesson.completedAt,
        lesson.scheduledAt,
      ),
      isFeedbackLocked: this.isActionLocked(
        lesson.feedbacksCompleted || false,
        lesson.status,
        lesson.completedAt,
        lesson.scheduledAt,
      ),
      isVoiceLocked: this.isActionLocked(
        lesson.voiceSent || false,
        lesson.status,
        lesson.completedAt,
        lesson.scheduledAt,
      ),
      isTextLocked: this.isActionLocked(
        lesson.textSent || false,
        lesson.status,
        lesson.completedAt,
        lesson.scheduledAt,
      ),
    };
  }

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
    const enrichedItems = items.map((lesson) => this.enrichLesson(lesson));

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
    return this.enrichLesson(lesson);
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

  async startLesson(id: string, userId: string, userRole: UserRole) {
    const lesson = await this.findById(id);

    // Check if teacher owns this lesson
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || teacher.id !== lesson.teacherId) {
        throw new ForbiddenException('You are not assigned to this lesson');
      }
    }

    if (lesson.status !== 'SCHEDULED') {
      throw new BadRequestException('Lesson cannot be started');
    }

    return this.prisma.lesson.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async completeLesson(id: string, dto: CompleteLessonDto, userId: string, userRole: UserRole) {
    const lesson = await this.findById(id);

    // Check if teacher owns this lesson
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || teacher.id !== lesson.teacherId) {
        throw new ForbiddenException('You are not assigned to this lesson');
      }
    }

    // Allow completing lessons that are SCHEDULED, IN_PROGRESS, or past lessons (CANCELLED/MISSED)
    // This allows teachers/admins to mark past lessons as completed retroactively
    if (!['SCHEDULED', 'IN_PROGRESS', 'CANCELLED', 'MISSED'].includes(lesson.status)) {
      throw new BadRequestException('Lesson cannot be completed');
    }

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: dto.notes,
      },
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
    });

    // Return enriched lesson with computed lock states
    return this.enrichLesson(updated);
  }

  async cancelLesson(id: string, reason?: string) {
    const lesson = await this.findById(id);

    if (['COMPLETED', 'CANCELLED'].includes(lesson.status)) {
      throw new BadRequestException('Lesson cannot be cancelled');
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
      },
    });
  }

  async markMissed(id: string) {
    const lesson = await this.findById(id);

    if (lesson.status !== 'SCHEDULED') {
      throw new BadRequestException('Only scheduled lessons can be marked as missed');
    }

    return this.prisma.lesson.update({
      where: { id },
      data: { status: 'MISSED' },
    });
  }

  async markVocabularySent(id: string) {
    // Verify lesson exists
    await this.findById(id);

    return this.prisma.lesson.update({
      where: { id },
      data: {
        vocabularySent: true,
        vocabularySentAt: new Date(),
      },
    });
  }

  async markAbsenceComplete(id: string) {
    // Verify lesson exists and get lesson data
    const lesson = await this.findById(id);

    const wasAlreadyMarked = lesson.absenceMarked;
    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        absenceMarked: true,
        absenceMarkedAt: new Date(),
      },
    });

    // Trigger salary recalculation if this is a new completion
    if (!wasAlreadyMarked && lesson.scheduledAt) {
      const lessonMonth = new Date(lesson.scheduledAt);
      await this.salariesService.recalculateSalaryForMonth(
        lesson.teacherId,
        lessonMonth,
      ).catch(() => {
        // Silently fail to avoid breaking the update
      });
    }

    return updated;
  }

  async markVoiceSent(id: string) {
    // Verify lesson exists and get lesson data
    const lesson = await this.findById(id);

    const wasAlreadySent = lesson.voiceSent;
    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        voiceSent: true,
        voiceSentAt: new Date(),
      },
    });

    // Trigger salary recalculation if this is a new completion
    if (!wasAlreadySent && lesson.scheduledAt) {
      const lessonMonth = new Date(lesson.scheduledAt);
      await this.salariesService.recalculateSalaryForMonth(
        lesson.teacherId,
        lessonMonth,
      ).catch(() => {
        // Silently fail to avoid breaking the update
      });
    }

    return updated;
  }

  async markTextSent(id: string) {
    // Verify lesson exists and get lesson data
    const lesson = await this.findById(id);

    const wasAlreadySent = lesson.textSent;
    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        textSent: true,
        textSentAt: new Date(),
      },
    });

    // Trigger salary recalculation if this is a new completion
    if (!wasAlreadySent && lesson.scheduledAt) {
      const lessonMonth = new Date(lesson.scheduledAt);
      await this.salariesService.recalculateSalaryForMonth(
        lesson.teacherId,
        lessonMonth,
      ).catch(() => {
        // Silently fail to avoid breaking the update
      });
    }

    return updated;
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

  // Schedule helper - create recurring lessons
  async createRecurring(params: {
    groupId: string;
    teacherId: string;
    weekdays: number[]; // Array of 0-6 (Sunday-Saturday)
    startTime: string; // "09:00"
    endTime: string; // "10:30"
    startDate: Date;
    endDate: Date;
    topic?: string;
    description?: string;
  }) {
    const { groupId, teacherId, weekdays, startTime, endTime, startDate, endDate, topic, description } = params;

    // Calculate duration from time range
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = endMinutes - startMinutes;

    if (duration <= 0) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate group exists and teacher is assigned
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { teacher: true },
    });

    if (!group) {
      throw new BadRequestException(`Group with ID ${groupId} not found`);
    }

    // Check if teacher is assigned to this group
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('You are not assigned to this group');
    }

    // Generate all potential lesson dates
    const lessons: CreateLessonDto[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    const endDateWithTime = new Date(endDate);
    endDateWithTime.setHours(23, 59, 59, 999);

    // Cap at 200 lessons to prevent abuse
    const MAX_LESSONS = 200;

    // First, generate all potential lesson dates
    const potentialLessons: Date[] = [];
    while (current <= endDateWithTime) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      if (weekdays.includes(dayOfWeek)) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const scheduledAt = new Date(current);
        scheduledAt.setHours(hours, minutes, 0, 0);

        if (scheduledAt >= startDate && scheduledAt <= endDateWithTime) {
          potentialLessons.push(scheduledAt);
        }
      }
      current.setDate(current.getDate() + 1);
    }

    // Check limit before querying
    if (potentialLessons.length > MAX_LESSONS) {
      throw new BadRequestException(
        `Cannot create more than ${MAX_LESSONS} lessons at once. Please reduce the date range or number of weekdays.`
      );
    }

    // Create lessons from all potential dates (allow duplicates - user can create lessons whenever they want)
    for (const scheduledAt of potentialLessons) {
      lessons.push({
        groupId,
        teacherId,
        scheduledAt: scheduledAt.toISOString(),
        duration,
        topic,
        description,
      });
    }

    if (lessons.length === 0) {
      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selectedWeekdays = weekdays.map(wd => weekdayNames[wd]).join(', ');
      
      throw new BadRequestException(
        `No lessons match the selected weekdays (${selectedWeekdays}) in the date range ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}.`
      );
    }

    return this.createBulk(lessons);
  }

  // Statistics
  async getLessonStatistics(teacherId?: string, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.LessonWhereInput = {};

    if (teacherId) where.teacherId = teacherId;

    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) where.scheduledAt.gte = dateFrom;
      if (dateTo) where.scheduledAt.lte = dateTo;
    }

    // Ensure connection is healthy before executing multiple queries
    await this.prisma.ensureConnected();

    // Execute queries with retry logic for connection errors
    const executeQueries = async () => {
      return await Promise.all([
        this.prisma.lesson.count({ where }),
        this.prisma.lesson.count({ where: { ...where, status: 'COMPLETED' } }),
        this.prisma.lesson.count({ where: { ...where, status: 'CANCELLED' } }),
        this.prisma.lesson.count({ where: { ...where, status: 'MISSED' } }),
        this.prisma.lesson.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      ]);
    };

    // Retry up to 3 times with exponential backoff
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const [total, completed, cancelled, missed, inProgress] = await executeQueries();

        return {
          total,
          completed,
          cancelled,
          missed,
          inProgress,
          scheduled: total - completed - cancelled - missed - inProgress,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      } catch (error) {
        lastError = error;
        
        // Check if it's a connection error
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        const isConnectionError = 
          errorMessage.includes('server has closed the connection') ||
          errorMessage.includes('connection reset') ||
          errorMessage.includes('econnreset') ||
          errorMessage.includes('connection closed') ||
          errorMessage.includes('code 10054') ||
          errorMessage.includes('forcibly closed');

        if (!isConnectionError || attempt === 2) {
          throw error;
        }

        // Wait before retry (exponential backoff: 100ms, 200ms)
        await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        
        // Ensure connection before retry
        try {
          await this.prisma.ensureConnected();
        } catch (reconnectError) {
          // If reconnection fails, wait a bit more and continue
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }

    throw lastError;
  }
}

