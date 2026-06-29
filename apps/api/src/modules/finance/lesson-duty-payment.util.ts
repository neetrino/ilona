import type { CompletedActions, LessonActionData } from '@ilona/types';
import { buildPaymentEligibleActions, type LessonDutyTimestamps } from '@ilona/types';

/** Prisma select shape for salary / payment eligibility calculations. */
export const lessonDutyPaymentSelect = {
  id: true,
  scheduledAt: true,
  absenceMarked: true,
  absenceMarkedAt: true,
  feedbacksCompleted: true,
  feedbacksCompletedAt: true,
  voiceSent: true,
  voiceSentAt: true,
  textSent: true,
  textSentAt: true,
  dailyPlan: {
    select: { id: true, createdAt: true },
  },
  feedbacks: {
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} as const;

type LessonDutyPaymentRow = {
  scheduledAt: Date;
  absenceMarked: boolean | null;
  absenceMarkedAt: Date | null;
  feedbacksCompleted: boolean | null;
  feedbacksCompletedAt: Date | null;
  voiceSent: boolean | null;
  voiceSentAt: Date | null;
  textSent: boolean | null;
  textSentAt: Date | null;
  dailyPlan: { id: string; createdAt: Date } | null;
  feedbacks?: { createdAt: Date }[];
};

export function toLessonDutyTimestamps(lesson: LessonDutyPaymentRow): LessonDutyTimestamps {
  return {
    scheduledAt: lesson.scheduledAt,
    absenceMarked: lesson.absenceMarked ?? false,
    absenceMarkedAt: lesson.absenceMarkedAt,
    feedbacksCompleted: lesson.feedbacksCompleted ?? false,
    feedbacksCompletedAt: lesson.feedbacksCompletedAt,
    voiceSent: lesson.voiceSent ?? false,
    voiceSentAt: lesson.voiceSentAt,
    textSent: lesson.textSent ?? false,
    textSentAt: lesson.textSentAt,
    dailyPlan: lesson.dailyPlan,
    latestFeedbackAt: lesson.feedbacks?.[0]?.createdAt ?? null,
  };
}

export function getPaymentEligibleActions(lesson: LessonDutyPaymentRow): CompletedActions {
  return buildPaymentEligibleActions(toLessonDutyTimestamps(lesson));
}

export function toLessonActionData(lesson: LessonDutyPaymentRow & { id: string }): LessonActionData {
  return {
    id: lesson.id,
    scheduledAt: lesson.scheduledAt,
    absenceMarked: lesson.absenceMarked,
    absenceMarkedAt: lesson.absenceMarkedAt,
    feedbacksCompleted: lesson.feedbacksCompleted,
    feedbacksCompletedAt: lesson.feedbacksCompletedAt,
    voiceSent: lesson.voiceSent,
    voiceSentAt: lesson.voiceSentAt,
    textSent: lesson.textSent,
    textSentAt: lesson.textSentAt,
    dailyPlan: lesson.dailyPlan,
    feedbacks: lesson.feedbacks,
  };
}
