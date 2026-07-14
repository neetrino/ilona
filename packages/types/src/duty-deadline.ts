// ============================================
// Daily duty deadline & payment eligibility
// ============================================

import type { CompletedActions } from './settings.types';
import {
  APP_TIMEZONE,
  endOfZonedDay,
  getCalendarDateInTimezone,
} from './app-timezone';

export type DutyActionKey = 'absence' | 'feedbacks' | 'voice' | 'text' | 'dailyPlan';

export interface DutyActionStatus {
  completed: boolean;
  paymentEligible: boolean;
  completedLate: boolean;
  /** Incomplete and past the 23:59 duty-day deadline (unpaid forever if never completed on time). */
  overdueUnpaid: boolean;
}

export interface LessonDutyTimestamps {
  scheduledAt: Date;
  absenceMarked: boolean;
  absenceMarkedAt?: Date | null;
  feedbacksCompleted: boolean;
  feedbacksCompletedAt?: Date | null;
  voiceSent: boolean;
  voiceSentAt?: Date | null;
  textSent: boolean;
  textSentAt?: Date | null;
  dailyPlan: { id: string; createdAt?: Date | null } | null;
  /** Fallback when feedbacksCompletedAt is missing (legacy rows). */
  latestFeedbackAt?: Date | null;
}

/**
 * End of duty day: 23:59:59.999 in the project timezone for the lesson's calendar date.
 */
export function getDutyDeadline(scheduledAt: Date, timeZone = APP_TIMEZONE): Date {
  return endOfZonedDay(getCalendarDateInTimezone(scheduledAt, timeZone), timeZone);
}

export function isCompletedOnTime(
  completedAt: Date | null | undefined,
  scheduledAt: Date,
  timeZone = APP_TIMEZONE,
): boolean {
  if (!completedAt) {
    return false;
  }
  const deadline = getDutyDeadline(scheduledAt, timeZone);
  return completedAt.getTime() <= deadline.getTime();
}

export function isDutyDeadlinePassed(
  scheduledAt: Date,
  now: Date = new Date(),
  timeZone = APP_TIMEZONE,
): boolean {
  return now.getTime() > getDutyDeadline(scheduledAt, timeZone).getTime();
}

function resolveFeedbackCompletedAt(lesson: LessonDutyTimestamps): Date | null {
  if (lesson.feedbacksCompletedAt) {
    return lesson.feedbacksCompletedAt;
  }
  if (lesson.latestFeedbackAt) {
    return lesson.latestFeedbackAt;
  }
  return null;
}

function resolveDailyPlanCompletedAt(lesson: LessonDutyTimestamps): Date | null {
  return lesson.dailyPlan?.createdAt ?? null;
}

function buildActionStatus(
  completed: boolean,
  completedAt: Date | null | undefined,
  scheduledAt: Date,
  now: Date,
): DutyActionStatus {
  if (!completed) {
    return {
      completed: false,
      paymentEligible: false,
      completedLate: false,
      overdueUnpaid: isDutyDeadlinePassed(scheduledAt, now),
    };
  }

  if (!completedAt) {
    // Legacy rows without timestamps — treat as on-time to avoid retroactive penalties.
    return {
      completed: true,
      paymentEligible: true,
      completedLate: false,
      overdueUnpaid: false,
    };
  }

  const onTime = isCompletedOnTime(completedAt, scheduledAt);
  return {
    completed: true,
    paymentEligible: onTime,
    completedLate: !onTime,
    overdueUnpaid: false,
  };
}

export function buildDutyActionStatuses(
  lesson: LessonDutyTimestamps,
  now: Date = new Date(),
): Record<DutyActionKey, DutyActionStatus> {
  return {
    absence: buildActionStatus(
      lesson.absenceMarked,
      lesson.absenceMarkedAt,
      lesson.scheduledAt,
      now,
    ),
    feedbacks: buildActionStatus(
      lesson.feedbacksCompleted,
      resolveFeedbackCompletedAt(lesson),
      lesson.scheduledAt,
      now,
    ),
    voice: buildActionStatus(lesson.voiceSent, lesson.voiceSentAt, lesson.scheduledAt, now),
    text: buildActionStatus(lesson.textSent, lesson.textSentAt, lesson.scheduledAt, now),
    dailyPlan: buildActionStatus(
      Boolean(lesson.dailyPlan),
      resolveDailyPlanCompletedAt(lesson),
      lesson.scheduledAt,
      now,
    ),
  };
}

export function buildPaymentEligibleActions(lesson: LessonDutyTimestamps): CompletedActions {
  const statuses = buildDutyActionStatuses(lesson);
  return {
    absence: statuses.absence.paymentEligible,
    feedbacks: statuses.feedbacks.paymentEligible,
    voice: statuses.voice.paymentEligible,
    text: statuses.text.paymentEligible,
    dailyPlan: statuses.dailyPlan.paymentEligible,
  };
}

export function buildCompletedActions(lesson: LessonDutyTimestamps): CompletedActions {
  return {
    absence: lesson.absenceMarked,
    feedbacks: lesson.feedbacksCompleted,
    voice: lesson.voiceSent,
    text: lesson.textSent,
    dailyPlan: Boolean(lesson.dailyPlan),
  };
}

export type DailyDutiesLessonStatus = 'DONE' | 'CAUTION' | 'IN_PROGRESS' | 'WAITING';

export function isLessonPastEnd(
  scheduledAt: Date,
  durationMinutes: number,
  now: Date = new Date(),
): boolean {
  const endMs = scheduledAt.getTime() + durationMinutes * 60 * 1000;
  return endMs < now.getTime();
}

/**
 * Lesson-level Daily Duties status for list/admin views.
 * DONE = all 5 duties completed before deadline; CAUTION = missed/late duties;
 * WAITING = lesson ended, deadline not passed; IN_PROGRESS = lesson not ended yet.
 */
export function computeDailyDutiesLessonStatus(
  lesson: LessonDutyTimestamps & { duration: number },
  now: Date = new Date(),
): DailyDutiesLessonStatus {
  if (!isLessonPastEnd(lesson.scheduledAt, lesson.duration, now)) {
    return 'IN_PROGRESS';
  }

  const dutyStatuses = buildDutyActionStatuses(lesson, now);
  const allOnTime = (Object.values(dutyStatuses) as DutyActionStatus[]).every(
    (s) => s.paymentEligible,
  );

  if (allOnTime) {
    return 'DONE';
  }

  if (!isDutyDeadlinePassed(lesson.scheduledAt, now)) {
    return 'WAITING';
  }

  return 'CAUTION';
}
