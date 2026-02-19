import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalaryStatus, LessonStatus } from '@prisma/client';
import { SalaryCalculationService } from './salary-calculation.service';
import type { CompletedActions } from '@ilona/types';

/**
 * Service responsible for salary record generation
 */
@Injectable()
export class SalaryGenerationService {
  private readonly logger = new Logger(SalaryGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculationService: SalaryCalculationService,
  ) {}

  /**
   * Recalculate and update salary record for a teacher for a specific month
   * This is called automatically when lesson actions are updated
   */
  async recalculateSalaryForMonth(teacherId: string, month: Date): Promise<void> {
    try {
      // Get start of month
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      
      // Check if salary record exists for this month
      const existing = await this.prisma.salaryRecord.findFirst({
        where: {
          teacherId,
          month: startOfMonth,
        },
      });

      if (existing) {
        // Recalculate and update existing record
        await this.generateSalaryRecord(teacherId, month);
      }
      // If no record exists, we don't create one automatically
      // It will be created when explicitly requested via generateSalaryRecord
    } catch (error) {
      // Silently fail to avoid breaking action updates
      // Log error in production
      this.logger.error(`Failed to recalculate salary for teacher ${teacherId}, month ${month}:`, error);
    }
  }

  /**
   * Generate salary record for a teacher for a month
   * Uses the same per-lesson calculation as calculateMonthlySalaryFromLessons for consistency
   * Salary is calculated per lesson (fixed price per class), NOT per hour
   */
  async generateSalaryRecord(teacherId: string, month: Date) {
    // Get teacher with lesson rate (per lesson, not per hour)
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!teacher) {
      throw new BadRequestException(`Teacher with ID ${teacherId} not found`);
    }

    // Get lesson rate: use lessonRateAMD if set, otherwise fall back to hourlyRate (assuming 1 hour = 1 lesson)
    const lessonRate = teacher.lessonRateAMD 
      ? Number(teacher.lessonRateAMD) 
      : Number(teacher.hourlyRate); // Fallback for backward compatibility

    // Get start and end of month
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

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
        feedbacksCompleted: true,
        absenceMarked: true,
        voiceSent: true,
        textSent: true,
      },
    });

    const lessonsCount = lessons.length;

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

    // Get action weights from settings (single source of truth)
    const weights = await this.calculationService.getActionWeights();

    // Calculate using the same per-lesson method as calculateMonthlySalaryFromLessons
    // This ensures idempotency and consistency
    // Base salary is per lesson (fixed price), NOT per hour
    // Use weighted calculation: earned = baseSalary * earnedPercent / 100
    let totalBaseSalary = 0;
    let totalEarned = 0;
    let totalOtherDeduction = 0;
    let totalObligationsCompleted = 0;
    let totalObligationsRequired = 0;

    for (const lesson of lessons) {
      // Base salary = lessonRateAMD (fixed price per lesson)
      const baseSalary = lessonRate;
      totalBaseSalary += baseSalary;

      // Calculate completed actions with their weights
      // Type assertion needed until Prisma client is regenerated
      const lessonData = lesson as { id: string; absenceMarked: boolean | null; feedbacksCompleted: boolean | null; voiceSent: boolean | null; textSent: boolean | null };
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
      totalObligationsRequired += totalActions;
      totalObligationsCompleted += completedCount;

      // Calculate earned percent based on completed actions and their weights
      const earnedPercent = this.calculationService.calculateEarnedPercent(completedActions, weights);

      // Calculate earned amount: baseSalary * earnedPercent / 100
      const earned = baseSalary * (earnedPercent / 100);
      totalEarned += earned;

      // Get other deductions for this lesson
      const lessonId = typeof lesson.id === 'string' ? lesson.id : String(lesson.id);
      const otherDeductionForLesson = deductionsByLessonId.get(lessonId) || 0;
      totalOtherDeduction += otherDeductionForLesson;
    }

    // Calculate totals using proportional calculation
    const grossAmount = totalBaseSalary; // Base salary is the gross (before deductions)
    const totalDeductions = totalOtherDeduction; // Only other deductions, no obligation-based deductions
    const netAmount = Math.max(0, totalEarned - totalDeductions);

    // Check if record already exists for this month
    // Use exact month match to leverage the unique constraint [teacherId, month]
    const existing = await this.prisma.salaryRecord.findFirst({
      where: {
        teacherId,
        month: startOfMonth,
      },
    });

    if (existing) {
      // Update existing record instead of throwing error to allow recalculation
      const obligationsInfo = {
        completed: totalObligationsCompleted,
        required: totalObligationsRequired,
        missing: totalObligationsRequired - totalObligationsCompleted,
        completionRate: totalObligationsRequired > 0 
          ? totalObligationsCompleted / totalObligationsRequired 
          : 0,
      };

      return this.prisma.salaryRecord.update({
        where: { id: existing.id },
        data: {
          lessonsCount,
          grossAmount,
          totalDeductions,
          netAmount,
          notes: JSON.stringify(obligationsInfo),
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

    // Store obligations info in notes as JSON
    const obligationsInfo = {
      completed: totalObligationsCompleted,
      required: totalObligationsRequired,
      missing: totalObligationsRequired - totalObligationsCompleted,
      completionRate: totalObligationsRequired > 0 
        ? totalObligationsCompleted / totalObligationsRequired 
        : 0,
    };

    return this.prisma.salaryRecord.create({
      data: {
        teacherId,
        month: startOfMonth,
        lessonsCount,
        grossAmount,
        totalDeductions,
        netAmount,
        status: SalaryStatus.PENDING,
        notes: JSON.stringify(obligationsInfo),
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
   * Generate monthly salary records for all teachers
   */
  async generateMonthlySalaries(year: number, month: number) {
    const targetMonth = new Date(year, month - 1, 1);

    // Get all active teachers
    const teachers = await this.prisma.teacher.findMany({
      where: {
        user: { status: 'ACTIVE' },
      },
    });

    const records = [];
    const errors = [];

    for (const teacher of teachers) {
      try {
        const record = await this.generateSalaryRecord(teacher.id, targetMonth);
        records.push(record);
      } catch (error) {
        errors.push({
          teacherId: teacher.id,
          error: (error as Error).message,
        });
      }
    }

    return {
      generated: records.length,
      errors: errors.length,
      records,
      errorDetails: errors,
    };
  }
}



