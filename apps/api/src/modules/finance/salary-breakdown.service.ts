import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalaryStatus, LessonStatus } from '@prisma/client';
import { SalaryCalculationService } from './salary-calculation.service';
import type { CompletedActions, LessonActionData } from '@ilona/types';

/**
 * Service responsible for salary breakdown and detail operations
 */
@Injectable()
export class SalaryBreakdownService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculationService: SalaryCalculationService,
  ) {}

  /**
   * Get teacher salary summary
   */
  async getTeacherSalarySummary(teacherId: string) {
    const [total, paid, pending] = await Promise.all([
      this.prisma.salaryRecord.aggregate({
        where: { teacherId },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.salaryRecord.aggregate({
        where: { teacherId, status: SalaryStatus.PAID },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.salaryRecord.aggregate({
        where: { teacherId, status: SalaryStatus.PENDING },
        _sum: { netAmount: true },
        _count: true,
      }),
    ]);

    // Get total deductions
    const deductions = await this.prisma.deduction.aggregate({
      where: { teacherId },
      _sum: { amount: true },
      _count: true,
    });

    return {
      total: {
        count: total._count,
        amount: Number(total._sum.netAmount) || 0,
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
    const teacher = await this.prisma.teacher.findUnique({
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
    const lessons = await this.prisma.lesson.findMany({
      where: {
        teacherId,
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
        id: true,
        topic: true,
        scheduledAt: true,
        completedAt: true,
        duration: true,
        absenceMarked: true,
        feedbacksCompleted: true,
        voiceSent: true,
        textSent: true,
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
    const otherDeductions = await this.prisma.deduction.findMany({
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
    otherDeductions.forEach((deduction) => {
      if (deduction.lessonId) {
        const current = deductionsByLessonId.get(deduction.lessonId) || 0;
        deductionsByLessonId.set(deduction.lessonId, current + Number(deduction.amount));
      }
    });

    // Get lesson rate: use lessonRateAMD if set, otherwise fall back to hourlyRate (assuming 1 hour = 1 lesson)
    const lessonRate = teacher.lessonRateAMD 
      ? Number(teacher.lessonRateAMD) 
      : Number(teacher.hourlyRate); // Fallback for backward compatibility

    // Get action weights from settings (single source of truth)
    const weights = await this.calculationService.getActionWeights();

    // Calculate per-lesson breakdown using weighted calculation
    // Base salary is per lesson (fixed price), NOT per hour
    const lessonBreakdown = lessons.map((lesson) => {
      // Base salary = lessonRateAMD (fixed price per lesson)
      const baseSalary = lessonRate;

      // Calculate completed actions with their weights
      const lessonData = lesson as unknown as LessonActionData & { 
        id: string;
        topic?: string | null; 
        scheduledAt: Date; 
        group?: { name: string } | null;
      };
      const completedActions: CompletedActions = {
        absence: lessonData.absenceMarked ?? false,
        feedbacks: lessonData.feedbacksCompleted ?? false,
        voice: lessonData.voiceSent ?? false,
        text: lessonData.textSent ?? false,
      };

      // Count completed actions for obligations tracking
      const completedCount = [
        completedActions.absence,
        completedActions.feedbacks,
        completedActions.voice,
        completedActions.text,
      ].filter(Boolean).length;
      const totalActions = 4;

      // Calculate earned percent based on completed actions and their weights
      const earnedPercent = this.calculationService.calculateEarnedPercent(completedActions, weights);

      // Calculate earned amount: baseSalary * earnedPercent / 100
      const earned = baseSalary * (earnedPercent / 100);

      // Get other deductions for this lesson
      const otherDeductionForLesson = deductionsByLessonId.get(lessonData.id) || 0;

      // Total = earned - other deductions
      const total = Math.max(0, earned - otherDeductionForLesson);

      // Deduction = baseSalary - earned (implicit deduction for missing actions)
      const deduction = baseSalary - earned + otherDeductionForLesson;

      // Lesson name: use topic if available, otherwise use group name + date
      const lessonName = lessonData.topic || lessonData.group?.name || 'Untitled Lesson';

      return {
        lessonId: lessonData.id,
        lessonName,
        lessonDate: lessonData.scheduledAt.toISOString(), // Use scheduledAt instead of completedAt, ensure ISO string format
        obligationCompleted: completedCount,
        obligationTotal: totalActions,
        salary: baseSalary,
        deduction: deduction,
        total,
      };
    });

    return {
      teacherId,
      teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
      month: month,
      lessons: lessonBreakdown,
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
    const lessons = await this.prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
        status: LessonStatus.COMPLETED,
      },
      select: { id: true },
    });

    if (lessons.length !== lessonIds.length) {
      const foundIds = new Set(lessons.map((l) => l.id));
      const missingIds = lessonIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Some lessons not found or not completed: ${missingIds.join(', ')}`
      );
    }

    // Change status to CANCELLED to exclude from salary calculation
    const result = await this.prisma.lesson.updateMany({
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
   * Returns which of the 4 actions (Absence, Feedbacks, Voice, Text) are completed
   */
  async getLessonObligation(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        absenceMarked: true,
        absenceMarkedAt: true,
        feedbacksCompleted: true,
        voiceSent: true,
        voiceSentAt: true,
        textSent: true,
        textSentAt: true,
        updatedAt: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    const absenceDone = lesson.absenceMarked ?? false;
    const feedbacksDone = lesson.feedbacksCompleted ?? false;
    const voiceDone = lesson.voiceSent ?? false;
    const textDone = lesson.textSent ?? false;

    const completedActionsCount = [
      absenceDone,
      feedbacksDone,
      voiceDone,
      textDone,
    ].filter(Boolean).length;

    return {
      lessonId: lesson.id,
      absenceDone,
      feedbacksDone,
      voiceDone,
      textDone,
      completedActionsCount,
      totalActions: 4,
      updatedAt: lesson.updatedAt.toISOString(),
    };
  }
}



