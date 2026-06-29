// ============================================
// Daily duty deadline & payment eligibility
// ============================================

import type { CompletedActions } from './settings.types';

/** Project timezone for daily duty deadlines (23:59 on duty date). */
export const APP_TIMEZONE = 'Asia/Yerevan';

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

function getCalendarDateInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function zonedWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string,
): Date {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const readParts = (instant: Date) => {
    const parts = dtf.formatToParts(instant);
    const map: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        map[part.type] = part.value;
      }
    }
    return map;
  };

  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  let ts = desiredUtc;

  for (let i = 0; i < 5; i++) {
    const p = readParts(new Date(ts));
    const actualUtc = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour),
      Number(p.minute),
      Number(p.second),
    );
    const diff = desiredUtc - actualUtc;
    if (Math.abs(diff) < 1) {
      break;
    }
    ts += diff;
  }

  return new Date(ts);
}

/**
 * End of duty day: 23:59:59.999 in the project timezone for the lesson's calendar date.
 */
export function getDutyDeadline(scheduledAt: Date, timeZone = APP_TIMEZONE): Date {
  const ymd = getCalendarDateInTimezone(scheduledAt, timeZone);
  const [y, m, d] = ymd.split('-').map(Number);
  return zonedWallClockToUtc(y, m, d, 23, 59, 59, 999, timeZone);
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
