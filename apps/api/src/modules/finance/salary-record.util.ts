import { LessonStatus } from '@ilona/database';
import { lessonsPayableToTeacherWhere } from '../../common/lesson-instructor';
import { SalaryCalculationService } from './salary-calculation.service';
import type { SalaryRecordDb } from './salary-record.types';

export function parseObligationsInfo(notes: string | null | undefined): unknown {
  if (!notes) return null;
  try {
    return JSON.parse(notes) as unknown;
  } catch {
    return null;
  }
}

export function getMonthBounds(monthDate: Date) {
  const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
  return { startOfMonth, endOfMonth };
}

export async function countSubstitutePayLessons(
  db: SalaryRecordDb,
  teacherId: string,
  monthDate: Date,
): Promise<number> {
  const { startOfMonth, endOfMonth } = getMonthBounds(monthDate);
  return db.lesson.count({
    where: {
      substituteTeacherId: teacherId,
      scheduledAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      status: {
        not: LessonStatus.CANCELLED,
      },
    },
  });
}

type LessonActionRow = {
  absenceMarked: boolean | null;
  feedbacksCompleted: boolean | null;
  voiceSent: boolean | null;
  textSent: boolean | null;
  dailyPlan: { id: string } | null;
};

import type { CompletedActions } from '@ilona/types';

export function buildPaidActionBreakdown(paidActionsPerLesson: CompletedActions[]) {
  const count = (key: keyof CompletedActions) =>
    paidActionsPerLesson.filter((actions) => actions[key]).length;

  return {
    absenceMarked: {
      completed: count('absence'),
      required: paidActionsPerLesson.length,
    },
    feedbacksCompleted: {
      completed: count('feedbacks'),
      required: paidActionsPerLesson.length,
    },
    voiceSent: {
      completed: count('voice'),
      required: paidActionsPerLesson.length,
    },
    textSent: {
      completed: count('text'),
      required: paidActionsPerLesson.length,
    },
    dailyPlan: {
      completed: count('dailyPlan'),
      required: paidActionsPerLesson.length,
    },
  };
}

export function buildActionBreakdown(lessons: LessonActionRow[]) {
  return {
    absenceMarked: {
      completed: lessons.filter((l) => l.absenceMarked ?? false).length,
      required: lessons.length,
    },
    feedbacksCompleted: {
      completed: lessons.filter((l) => l.feedbacksCompleted ?? false).length,
      required: lessons.length,
    },
    voiceSent: {
      completed: lessons.filter((l) => l.voiceSent ?? false).length,
      required: lessons.length,
    },
    textSent: {
      completed: lessons.filter((l) => l.textSent ?? false).length,
      required: lessons.length,
    },
    dailyPlan: {
      completed: lessons.filter((l) => Boolean(l.dailyPlan)).length,
      required: lessons.length,
    },
  };
}

export async function enrichSalaryRecordRow(
  db: SalaryRecordDb,
  calculationService: SalaryCalculationService,
  salaryRecord: {
    teacherId: string;
    month: Date;
    notes: string | null;
    [key: string]: unknown;
  },
) {
  const obligationsInfo = parseObligationsInfo(salaryRecord.notes);
  const computedSalary = await calculationService.calculateMonthlySalaryFromLessons(
    salaryRecord.teacherId,
    salaryRecord.month,
  );
  const substituteCount = await countSubstitutePayLessons(
    db,
    salaryRecord.teacherId,
    salaryRecord.month,
  );

  return {
    ...salaryRecord,
    netAmount: computedSalary,
    obligationsInfo,
    hasSubstituteEarnings: substituteCount > 0,
    month: salaryRecord.month.getMonth() + 1,
    year: salaryRecord.month.getFullYear(),
  };
}

export async function countPayableLessonsForMonth(
  db: SalaryRecordDb,
  teacherId: string,
  monthDate: Date,
): Promise<number> {
  const { startOfMonth, endOfMonth } = getMonthBounds(monthDate);
  return db.lesson.count({
    where: {
      ...lessonsPayableToTeacherWhere(teacherId),
      scheduledAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      status: {
        not: LessonStatus.CANCELLED,
      },
    },
  });
}
