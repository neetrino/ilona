import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SalaryStatus, LessonStatus } from '@ilona/database';
import { SalaryCalculationService } from './salary-calculation.service';
import type { LessonActionData } from '@ilona/types';
import {
  getPaymentEligibleActions,
  lessonDutyPaymentSelect,
} from './lesson-duty-payment.util';
import {
  lessonsPayableToTeacherWhere,
  isSubstitutePayeeLesson,
} from '../../common/lesson-instructor';

/** Prisma delegate access for this service. */
type PrismaDelegates = {
  salaryRecord: Prisma.SalaryRecordDelegate;
  deduction: Prisma.DeductionDelegate;
  teacher: Prisma.TeacherDelegate;
  lesson: Prisma.LessonDelegate;
};

/**
 * Service responsible for salary breakdown and detail operations
 */
@Injectable()
export class SalaryBreakdownService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculationService: SalaryCalculationService,
  ) {}

  private get db(): PrismaDelegates {
    return this.prisma as unknown as PrismaDelegates;
  }

  /**
   * Get teacher salary summary
   */
  async getTeacherSalarySummary(teacherId: string) {
    const [total, paid, pending, recordsForLessons] = await Promise.all([
      this.db.salaryRecord.aggregate({
        where: { teacherId },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.db.salaryRecord.aggregate({
        where: { teacherId, status: SalaryStatus.PAID },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.db.salaryRecord.aggregate({
        where: { teacherId, status: SalaryStatus.PENDING },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.db.salaryRecord.findMany({
        where: { teacherId },
        select: { lessonsCount: true },
      }),
    ]);

    // Get total deductions
    const deductions = await this.db.deduction.aggregate({
      where: { teacherId },
      _sum: { amount: true },
      _count: true,
    });

    const totalAmount = Number(total._sum.netAmount) || 0;
    const lessonsCount = recordsForLessons.reduce(
      (sum: number, r: { lessonsCount: number | null }) => sum + (r.lessonsCount || 0),
      0,
    );
    const averagePerLesson = lessonsCount > 0 ? totalAmount / lessonsCount : 0;

    return {
      total: {
        count: total._count,
        amount: totalAmount,
      },
      paid: {
        count: paid._count,
        amount: Number(paid._sum.netAmount) || 0,
      },
      pending: {
        count: pending._count,
        amount: Number(pending._sum.netAmount) || 0,
      },
      deductions: {
        count: deductions._count,
        amount: Number(deductions._sum.amount) || 0,
      },
      lessonsCount,
      averagePerLesson,
    };
  }

  /**
   * Get salary breakdown by teacher and month (lesson-level details)
   */
  async getSalaryBreakdown(teacherId: string, month: string) {
    // Parse month string (YYYY-MM format)
    const [year, monthNum] = month.split('-').map(Number);
    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('Invalid month format. Expected YYYY-MM');
    }

    // Get teacher
    const teacher = await this.db.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Get start and end of month
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);

    // Get ALL lessons for this month (not just completed ones)
    const lessons = await this.db.lesson.findMany({
      where: {
        ...lessonsPayableToTeacherWhere(teacherId),
        scheduledAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        // Exclude cancelled lessons
        status: {
          not: LessonStatus.CANCELLED,
        },
      },
      select: {
        ...lessonDutyPaymentSelect,
        teacherId: true,
        substituteTeacherId: true,
        topic: true,
        completedAt: true,
        duration: true,
        teacher: {
          select: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    // Get other deductions for this period (from Deduction table)
    const otherDeductions = await this.db.deduction.findMany({
      where: {
        teacherId,
        appliedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        amount: true,
        lessonId: true,
      },
    });

    // Create a map of lessonId -> deductions
    const deductionsByLessonId = new Map<string, number>();
    otherDeductions.forEach((deduction: { lessonId: string | null; amount: unknown }) => {
      if (deduction.lessonId) {
        const current = deductionsByLessonId.get(deduction.lessonId) || 0;
        deductionsByLessonId.set(deduction.lessonId, current + Number(deduction.amount));
      }
    });

    // Get lesson rate: use lessonRateAMD if set, otherwise fall back to hourlyRate (assuming 1 hour = 1 lesson)
    const lessonRate = teacher.lessonRateAMD 
      ? Number(teacher.lessonRateAMD) 
      : Number(teacher.hourlyRate); // Fallback for backward compatibility

    // Get penalty amounts from settings (single source of truth)
    const penalties = await this.calculationService.getPenaltyAmounts();

    // Calculate per-lesson breakdown using fixed penalty system
    // Base salary is per lesson (fixed price), NOT per hour
    type LessonRow = (typeof lessons)[number];
    const lessonBreakdown = lessons.map((lesson: LessonRow) => {
      const isSubstituteLesson = isSubstitutePayeeLesson(lesson, teacherId);
      const mainUser = lesson.teacher?.user;
      const mainTeacherName =
        isSubstituteLesson && mainUser
          ? `${mainUser.firstName ?? ''} ${mainUser.lastName ?? ''}`.trim() || undefined
          : undefined;
      // Base salary = lessonRateAMD (fixed price per lesson)
      const baseSalary = lessonRate;

      const lessonData = lesson as unknown as LessonActionData & {
        id: string;
        topic?: string | null;
        scheduledAt: Date;
        group?: { name: string } | null;
      };
      const paymentEligibleActions = getPaymentEligibleActions(lesson);

      const paidActionCount = [
        paymentEligibleActions.absence,
        paymentEligibleActions.feedbacks,
        paymentEligibleActions.voice,
        paymentEligibleActions.text,
        paymentEligibleActions.dailyPlan,
      ].filter(Boolean).length;
      const totalActions = 5;

      const penaltyDeduction = this.calculationService.calculateDeduction(
        paymentEligibleActions,
        penalties,
      );

      const payable = this.calculationService.calculatePayableAmount(
        baseSalary,
        paymentEligibleActions,
        penalties,
      );

      // Get other deductions for this lesson
      const otherDeductionForLesson = deductionsByLessonId.get(lessonData.id) || 0;

      // Total = payable - other deductions
      const total = Math.max(0, payable - otherDeductionForLesson);

      // Deduction = penalty deduction + other deductions
      const deduction = penaltyDeduction + otherDeductionForLesson;

      const lessonName = lessonData.topic || lessonData.group?.name || 'Untitled Lesson';
      const groupName = lessonData.group?.name || lessonName;

      return {
        lessonId: lessonData.id,
        lessonName,
        groupName,
        lessonDate: lessonData.scheduledAt.toISOString(),
        obligationCompleted: paidActionCount,
        obligationTotal: totalActions,
        salary: baseSalary,
        deduction: deduction,
        total,
        isSubstituteLesson,
        mainTeacherName,
      };
    });

    const substituteLessons = lessonBreakdown.filter((row) => row.isSubstituteLesson);
    const substituteSummary = {
      lessonCount: substituteLessons.length,
      netAmount: substituteLessons.reduce((sum, row) => sum + row.total, 0),
    };

    return {
      teacherId,
      teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
      month: month,
      lessons: lessonBreakdown,
      substituteSummary,
    };
  }

  /**
   * Exclude lessons from salary calculation by changing their status to CANCELLED
   * This removes them from salary breakdown without deleting the lessons
   */
  async excludeLessonsFromSalary(lessonIds: string[]) {
    if (!lessonIds || lessonIds.length === 0) {
      throw new BadRequestException('Lesson IDs array is required and cannot be empty');
    }

    // Verify all lessons exist and are COMPLETED
    const lessons = await this.db.lesson.findMany({
      where: {
        id: { in: lessonIds },
        status: LessonStatus.COMPLETED,
      },
      select: { id: true },
    });

    if (lessons.length !== lessonIds.length) {
      const foundIds = new Set(lessons.map((l: { id: string }) => l.id));
      const missingIds = lessonIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Some lessons not found or not completed: ${missingIds.join(', ')}`
      );
    }

    // Change status to CANCELLED to exclude from salary calculation
    const result = await this.db.lesson.updateMany({
      where: {
        id: { in: lessonIds },
        status: LessonStatus.COMPLETED,
      },
      data: {
        status: LessonStatus.CANCELLED,
      },
    });

    return {
      count: result.count,
      lessonIds: lessonIds,
    };
  }

  /**
   * Get obligation details for a specific lesson
   * Returns which of the required actions are completed
   */
  async getLessonObligation(lessonId: string) {
    const lesson = await this.db.lesson.findUnique({
      where: { id: lessonId },
      select: {
        ...lessonDutyPaymentSelect,
        updatedAt: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    const paymentEligible = getPaymentEligibleActions(lesson);
    const absenceDone = lesson.absenceMarked ?? false;
    const feedbacksDone = lesson.feedbacksCompleted ?? false;
    const voiceDone = lesson.voiceSent ?? false;
    const textDone = lesson.textSent ?? false;
    const dailyPlanDone = Boolean(lesson.dailyPlan);

    const completedActionsCount = [
      absenceDone,
      feedbacksDone,
      voiceDone,
      textDone,
      dailyPlanDone,
    ].filter(Boolean).length;

    const paidActionsCount = [
      paymentEligible.absence,
      paymentEligible.feedbacks,
      paymentEligible.voice,
      paymentEligible.text,
      paymentEligible.dailyPlan,
    ].filter(Boolean).length;

    return {
      lessonId: lesson.id,
      absenceDone,
      feedbacksDone,
      voiceDone,
      textDone,
      dailyPlanDone,
      completedActionsCount,
      paidActionsCount,
      totalActions: 5,
      updatedAt: lesson.updatedAt.toISOString(),
    };
  }
}



