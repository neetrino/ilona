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
  }) {
    const { skip = 0, take = 50, groupId, teacherId, status, dateFrom, dateTo } = params || {};

    const where: Prisma.LessonWhereInput = {};

    if (groupId) where.groupId = groupId;
    if (teacherId) where.teacherId = teacherId;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) where.scheduledAt.gte = dateFrom;
      if (dateTo) where.scheduledAt.lte = dateTo;
    }

    const [items, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledAt: 'desc' },
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

  async findById(id: string) {
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

    return lesson;
  }

  async findByTeacher(teacherId: string, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.LessonWhereInput = { teacherId };

    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) where.scheduledAt.gte = dateFrom;
      if (dateTo) where.scheduledAt.lte = dateTo;
    }

    return this.prisma.lesson.findMany({
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
        _count: {
          select: { attendances: true, feedbacks: true },
        },
      },
    });
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

  async update(id: string, dto: UpdateLessonDto) {
    const lesson = await this.findById(id);

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
    schedule: {
      dayOfWeek: number; // 0-6 (Sunday-Saturday)
      time: string; // "09:00"
    }[];
    startDate: Date;
    endDate: Date;
    duration?: number;
    topic?: string;
  }) {
    const { groupId, teacherId, schedule, startDate, endDate, duration = 60, topic } = params;

    const lessons: CreateLessonDto[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      for (const slot of schedule) {
        if (current.getDay() === slot.dayOfWeek) {
          const [hours, minutes] = slot.time.split(':').map(Number);
          const scheduledAt = new Date(current);
          scheduledAt.setHours(hours, minutes, 0, 0);

          if (scheduledAt >= startDate && scheduledAt <= endDate) {
            lessons.push({
              groupId,
              teacherId,
              scheduledAt: scheduledAt.toISOString(),
              duration,
              topic,
            });
          }
        }
      }
      current.setDate(current.getDate() + 1);
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

