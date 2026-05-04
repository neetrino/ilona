import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { effectiveLessonInstructorTeacherId } from '../../common/lesson-instructor';
import { Prisma, DeductionReason } from '@ilona/database';
import { CreateDeductionDto } from './dto/create-deduction.dto';

/** Prisma delegate access for this service. */
type PrismaDelegates = {
  deduction: Prisma.DeductionDelegate;
  teacher: Prisma.TeacherDelegate;
  lesson: Prisma.LessonDelegate;
};

/** Where arg type for delegate (avoids crossing Prisma type sources). */
type WhereFor<T> = T extends (args?: infer A) => unknown
  ? A extends { where?: infer W } ? W : never
  : never;

type DeductionWhereFindMany = WhereFor<PrismaDelegates['deduction']['findMany']>;
type DeductionWhereCount = WhereFor<PrismaDelegates['deduction']['count']>;
type DeductionWhereAggregate = WhereFor<PrismaDelegates['deduction']['aggregate']>;
type DeductionWhereGroupBy = WhereFor<PrismaDelegates['deduction']['groupBy']>;

@Injectable()
export class DeductionsService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): PrismaDelegates {
    return this.prisma as unknown as PrismaDelegates;
  }

  /**
   * Get all deductions
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    teacherId?: string;
    reason?: DeductionReason;
    dateFrom?: Date;
    dateTo?: Date;
    centerId?: string;
  }) {
    const { skip = 0, take = 50, teacherId, reason, dateFrom, dateTo, centerId } = params || {};

    const where: Prisma.DeductionWhereInput = {};

    if (teacherId) where.teacherId = teacherId;
    if (reason) where.reason = reason;
    if (dateFrom || dateTo) {
      where.appliedAt = {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      };
    }
    if (centerId) {
      where.teacher = { centerLinks: { some: { centerId } } };
    }

    const [items, total] = await Promise.all([
      this.db.deduction.findMany({
        where: where as unknown as DeductionWhereFindMany,
        skip,
        take,
        orderBy: { appliedAt: 'desc' },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.db.deduction.count({ where: where as unknown as DeductionWhereCount }),
    ]);

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Get deduction by ID
   */
  async findById(id: string) {
    const deduction = await this.db.deduction.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!deduction) {
      throw new NotFoundException(`Deduction with ID ${id} not found`);
    }

    return deduction;
  }

  /**
   * Create a deduction
   */
  async create(dto: CreateDeductionDto) {
    // Validate teacher
    const teacher = await this.db.teacher.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
    }

    // Validate lesson if provided
    if (dto.lessonId) {
      const lesson = await this.db.lesson.findUnique({
        where: { id: dto.lessonId },
      });
      if (!lesson) {
        throw new BadRequestException(`Lesson with ID ${dto.lessonId} not found`);
      }
    }

    return this.db.deduction.create({
      data: {
        teacherId: dto.teacherId,
        reason: dto.reason,
        amount: dto.amount,
        percentage: dto.percentage,
        note: dto.note,
        lessonId: dto.lessonId,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Create deduction for missing vocabulary
   */
  async createVocabularyDeduction(lessonId: string, amount: number) {
    const lesson = await this.db.lesson.findUnique({
      where: { id: lessonId },
      include: { teacher: true },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return this.create({
      teacherId: effectiveLessonInstructorTeacherId(lesson),
      reason: DeductionReason.MISSING_VOCABULARY,
      amount,
      note: `Missing vocabulary for lesson on ${lesson.scheduledAt.toISOString().split('T')[0]}`,
      lessonId,
    });
  }

  /**
   * Create deduction for missing feedback
   */
  async createFeedbackDeduction(lessonId: string, amount: number) {
    const lesson = await this.db.lesson.findUnique({
      where: { id: lessonId },
      include: { teacher: true },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return this.create({
      teacherId: effectiveLessonInstructorTeacherId(lesson),
      reason: DeductionReason.MISSING_FEEDBACK,
      amount,
      note: `Missing feedback for lesson on ${lesson.scheduledAt.toISOString().split('T')[0]}`,
      lessonId,
    });
  }

  /**
   * Delete a deduction (admin only)
   */
  async delete(id: string) {
    await this.findById(id);

    return this.db.deduction.delete({
      where: { id },
    });
  }

  /**
   * Get deduction statistics
   */
  async getStatistics(teacherId?: string, dateFrom?: Date, dateTo?: Date, centerId?: string) {
    const where: Prisma.DeductionWhereInput = {
      ...(teacherId && { teacherId }),
      ...(dateFrom || dateTo
        ? {
            appliedAt: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
      ...(centerId ? { teacher: { centerLinks: { some: { centerId } } } } : {}),
    };

    const [total, byReason] = await Promise.all([
      this.db.deduction.aggregate({
        where: where as unknown as DeductionWhereAggregate,
        _sum: { amount: true },
        _count: true,
      }),
      this.db.deduction.groupBy({
        by: ['reason'],
        where: where as unknown as DeductionWhereGroupBy,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total: {
        count: total._count,
        amount: Number(total._sum?.amount) ?? 0,
      },
      byReason: byReason.map((t) => ({
        reason: t.reason,
        count: t._count,
        amount: Number(t._sum?.amount) || 0,
      })),
    };
  }

  /**
   * Check for lessons without vocabulary and create deductions
   */
  async checkMissingVocabulary(hoursAfterLesson: number = 24, deductionAmount: number = 10) {
    const cutoffTime = new Date(Date.now() - hoursAfterLesson * 60 * 60 * 1000);

    // Find completed lessons without vocabulary sent
    const lessons = await this.db.lesson.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { lt: cutoffTime },
        vocabularySent: false,
      },
      include: {
        teacher: true,
      },
    });

    const deductions = [];
    for (const lesson of lessons) {
      // Check if deduction already exists
      const existing = await this.db.deduction.findFirst({
        where: {
          lessonId: lesson.id,
          reason: DeductionReason.MISSING_VOCABULARY,
        },
      });

      if (!existing) {
        const deduction = await this.createVocabularyDeduction(lesson.id, deductionAmount);
        deductions.push(deduction);
      }
    }

    return {
      checked: lessons.length,
      created: deductions.length,
      deductions,
    };
  }

  /**
   * Check for lessons without feedback and create deductions
   */
  async checkMissingFeedback(hoursAfterLesson: number = 24, deductionAmount: number = 15) {
    const cutoffTime = new Date(Date.now() - hoursAfterLesson * 60 * 60 * 1000);

    // Find completed lessons without feedback
    const lessons = await this.db.lesson.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { lt: cutoffTime },
        feedbacksCompleted: false,
      },
      include: {
        teacher: true,
      },
    });

    const deductions = [];
    for (const lesson of lessons) {
      // Check if deduction already exists
      const existing = await this.db.deduction.findFirst({
        where: {
          lessonId: lesson.id,
          reason: DeductionReason.MISSING_FEEDBACK,
        },
      });

      if (!existing) {
        const deduction = await this.createFeedbackDeduction(lesson.id, deductionAmount);
        deductions.push(deduction);
      }
    }

    return {
      checked: lessons.length,
      created: deductions.length,
      deductions,
    };
  }
}
