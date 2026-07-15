import { addCalendarDays, toYmd } from '@ilona/types';

/** Initial and each auto-extension lesson window length. */
export const GROUP_SCHEDULE_ROLLING_DAYS = 90;

/** When fewer than this many days remain until `dateTo`, cron extends the window. */
export const GROUP_SCHEDULE_EXTEND_LEAD_DAYS = 14;

/** Soft cap for one generation/extension batch (90 days × dense weekdays). */
export const GROUP_SCHEDULE_MAX_OCCURRENCES = 400;

export function scheduleHorizonFromStart(startYmd: string): string {
  return addCalendarDays(startYmd, GROUP_SCHEDULE_ROLLING_DAYS);
}

/** Next calendar day after `ymd` (used as start of an extension window). */
export function dayAfterYmd(ymd: string): string {
  return addCalendarDays(ymd, 1);
}

export function daysUntilYmd(ymd: string, now: Date = new Date()): number {
  const today = toYmd(now);
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const targetMs = Date.parse(`${ymd}T00:00:00Z`);
  if (Number.isNaN(todayMs) || Number.isNaN(targetMs)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.round((targetMs - todayMs) / 86_400_000);
}
