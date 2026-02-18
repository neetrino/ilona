import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { LessonStatus } from '@prisma/client';
import type { ActionWeights, CompletedActions } from '@ilona/types';

/**
 * Service responsible for salary calculation logic
 */
@Injectable()
export class SalaryCalculationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get action weights from settings (single source of truth)
   */
  async getActionWeights(): Promise<ActionWeights> {
    const settings = await this.settingsService.getActionPercents();
    return {
      absence: settings.absencePercent,
      feedbacks: settings.feedbacksPercent,
      voice: settings.voicePercent,
      text: settings.textPercent,
    };
  }

  /**
   * Calculate earned percent for a lesson based on completed actions and weights
   */
  calculateEarnedPercent(
    completedActions: CompletedActions,
    weights: ActionWeights,
  ): number {
    let earnedPercent = 0;
    if (completedActions.absence) earnedPercent += weights.absence;
    if (completedActions.feedbacks) earnedPercent += weights.feedbacks;
    if (completedActions.voice) earnedPercent += weights.voice;
    if (completedActions.text) earnedPercent += weights.text;
    return earnedPercent;
  }

  /**
   * Calculate monthly salary from lessons for a teacher
   * This is the single source of truth for salary calculation
   * Returns: SUM of (baseSalary * earnedPercent / 100) for all lessons in the month
   * Salary is calculated per lesson (fixed price per class), NOT per hour
   * Salary updates immediately when ANY of the 4 actions is completed, without requiring "Lesson Complete"
   */
  async calculateMonthlySalaryFromLessons(teacherId: string, month: Date): Promise<number> {
    // Get start and end of month
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

    // Get teacher with lesson rate (per lesson, not per hour)
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { lessonRateAMD: true, hourlyRate: true }, // Keep hourlyRate for backward compatibility
    });

    if (!teacher) {
      return 0;
    }

    // Get lesson rate: use lessonRateAMD if set, otherwise fall back to hourlyRate (assuming 1 hour = 1 lesson)
    const lessonRate = teacher.lessonRateAMD 
      ? Number(teacher.lessonRateAMD) 
      : Number(teacher.hourlyRate); // Fallback for backward compatibility

    // Get ALL lessons for this month (not just completed ones)
    // Filter by scheduledAt to include all lessons scheduled in this month
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
        absenceMarked: true,
        feedbacksCompleted: true,
        voiceSent: true,
        textSent: true,
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

    // Get action weights from settings (single source of truth)
    const weights = await this.getActionWeights();

    // Calculate total salary from all lessons using weighted calculation
    // Base salary is per lesson (fixed price), NOT per hour
    let totalSalary = 0;

    for (const lesson of lessons) {
      // Base salary = lessonRateAMD (fixed price per lesson)
      const baseSalary = lessonRate;

      // Calculate completed actions with their weights
      // Type assertion needed until Prisma client is regenerated
      const lessonData = lesson as { id: string; absenceMarked: boolean | null; feedbacksCompleted: boolean | null; voiceSent: boolean | null; textSent: boolean | null };
      const completedActions = {
        absence: lessonData.absenceMarked ?? false,
        feedbacks: lessonData.feedbacksCompleted ?? false,
        voice: lessonData.voiceSent ?? false,
        text: lessonData.textSent ?? false,
      };

      // Calculate earned percent based on completed actions and their weights
      const earnedPercent = this.calculateEarnedPercent(completedActions, weights);

      // Calculate earned amount: baseSalary * earnedPercent / 100
      const earned = baseSalary * (earnedPercent / 100);

      // Get other deductions for this lesson
      const lessonId = typeof lesson.id === 'string' ? lesson.id : String(lesson.id);
      const otherDeductionForLesson = deductionsByLessonId.get(lessonId) || 0;

      // Total = earned - other deductions
      const lessonTotal = Math.max(0, earned - otherDeductionForLesson);
      totalSalary += lessonTotal;
    }

    return totalSalary;
  }
}

