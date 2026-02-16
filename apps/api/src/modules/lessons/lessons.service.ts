import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto, CompleteLessonDto } from './dto';
import { Prisma, LessonStatus, UserRole } from '@prisma/client';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return {
      items,
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

    return lesson;
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

    // Check for time conflicts
    const conflictingLesson = await this.prisma.lesson.findFirst({
      where: {
        teacherId: dto.teacherId,
        scheduledAt: {
          gte: new Date(new Date(dto.scheduledAt).getTime() - (dto.duration || 60) * 60000),
          lte: new Date(new Date(dto.scheduledAt).getTime() + (dto.duration || 60) * 60000),
        },
        status: { notIn: ['CANCELLED', 'MISSED'] },
      },
    });

    if (conflictingLesson) {
      throw new BadRequestException('Teacher has a conflicting lesson at this time');
    }

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

    return this.prisma.lesson.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: dto.notes,
      },
    });
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
    // Verify lesson exists
    await this.findById(id);

    return this.prisma.lesson.update({
      where: { id },
      data: {
        absenceMarked: true,
        absenceMarkedAt: new Date(),
      },
    });
  }

  async markVoiceSent(id: string) {
    // Verify lesson exists
    await this.findById(id);

    return this.prisma.lesson.update({
      where: { id },
      data: {
        voiceSent: true,
        voiceSentAt: new Date(),
      },
    });
  }

  async markTextSent(id: string) {
    // Verify lesson exists
    await this.findById(id);

    return this.prisma.lesson.update({
      where: { id },
      data: {
        textSent: true,
        textSentAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    const lesson = await this.findById(id);

    if (lesson.status === 'COMPLETED') {
      throw new BadRequestException('Cannot delete completed lesson');
    }

    return this.prisma.lesson.delete({
      where: { id },
    });
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

    // Fetch existing lessons in the date range to check for duplicates
    const existingLessons = await this.prisma.lesson.findMany({
      where: {
        groupId,
        teacherId,
        scheduledAt: {
          gte: startDate,
          lte: endDateWithTime,
        },
      },
      select: {
        scheduledAt: true,
      },
    });

    // Create a set of existing lesson times (rounded to minute) for quick lookup
    const existingTimes = new Set(
      existingLessons.map((lesson) => {
        const date = new Date(lesson.scheduledAt);
        // Round to minute precision
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      })
    );

    // Filter out duplicates
    for (const scheduledAt of potentialLessons) {
      const timeKey = `${scheduledAt.getFullYear()}-${String(scheduledAt.getMonth() + 1).padStart(2, '0')}-${String(scheduledAt.getDate()).padStart(2, '0')}T${String(scheduledAt.getHours()).padStart(2, '0')}:${String(scheduledAt.getMinutes()).padStart(2, '0')}`;
      
      if (!existingTimes.has(timeKey)) {
        lessons.push({
          groupId,
          teacherId,
          scheduledAt: scheduledAt.toISOString(),
          duration,
          topic,
          description,
        });
      }
    }

    if (lessons.length === 0) {
      throw new BadRequestException('No lessons would be created with the provided parameters');
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

