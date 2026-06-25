import type { GroupScheduleEntry } from './types';

export interface NormalizedGroupCalendar {
  dateFrom: string;
  dateTo: string;
  topic?: string;
  description?: string;
}

/**
 * Matches backend `parseGroupSchedulePayload` (without server-only fields).
 */
/** Weekly slots only — use wherever code used to iterate `group.schedule` as an array. */
export function getGroupWeeklySlots(raw: unknown): GroupScheduleEntry[] {
  return normalizeGroupSchedulePayload(raw).weeklySlots;
}

export function normalizeGroupSchedulePayload(raw: unknown): {
  weeklySlots: GroupScheduleEntry[];
  calendar: NormalizedGroupCalendar | null;
} {
  if (raw == null) {
    return { weeklySlots: [], calendar: null };
  }
  if (Array.isArray(raw)) {
    return { weeklySlots: raw as GroupScheduleEntry[], calendar: null };
  }
  if (typeof raw === 'object' && raw !== null && 'weeklySlots' in raw) {
    const o = raw as { weeklySlots?: GroupScheduleEntry[]; calendar?: NormalizedGroupCalendar };
    return {
      weeklySlots: Array.isArray(o.weeklySlots) ? o.weeklySlots : [],
      calendar: o.calendar ?? null,
    };
  }
  return { weeklySlots: [], calendar: null };
}

/** Format a Date as YYYY-MM-DD in local time (avoids UTC shift from toISOString). */
export function formatLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Default span from schedule start to end date (inclusive offset in days). */
export const GROUP_SCHEDULE_DEFAULT_DURATION_DAYS = 30;

export function addDaysToYmd(ymd: string, days: number): string {
  const d = parseYmd(ymd);
  if (!d) return ymd;
  d.setDate(d.getDate() + days);
  return formatLocalYmd(d);
}

/** Default calendar range when opening group create/edit: today through 30 days later. */
export function defaultMonthDateRange(): { from: string; to: string } {
  const from = formatLocalYmd(new Date());
  return {
    from,
    to: addDaysToYmd(from, GROUP_SCHEDULE_DEFAULT_DURATION_DAYS),
  };
}

/** End date for a schedule that starts on `startYmd` (start + default duration). */
export function scheduleEndDateFromStart(startYmd: string): string {
  return addDaysToYmd(startYmd, GROUP_SCHEDULE_DEFAULT_DURATION_DAYS);
}

function parseYmd(ymd: string): Date | null {
  const d = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function endOfDayFromYmd(ymd: string): Date | null {
  const d = parseYmd(ymd);
  if (!d) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

function slotDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/** Client-side preview; mirrors server occurrence rules. */
export function previewLessonOccurrences(
  weeklySlots: GroupScheduleEntry[],
  dateFromYmd: string,
  dateToYmd: string,
): Date[] {
  const startDay = parseYmd(dateFromYmd);
  const endBoundary = endOfDayFromYmd(dateToYmd);
  if (!startDay || !endBoundary) return [];
  startDay.setHours(0, 0, 0, 0);
  const out: Date[] = [];
  const cur = new Date(startDay);
  while (cur <= endBoundary) {
    const dow = cur.getDay();
    for (const slot of weeklySlots) {
      if (slot.dayOfWeek !== dow) continue;
      const dur = slotDurationMinutes(slot.startTime, slot.endTime);
      if (dur <= 0) continue;
      const [h, m] = slot.startTime.split(':').map(Number);
      const at = new Date(cur);
      at.setHours(h, m, 0, 0);
      if (at >= startDay && at <= endBoundary) {
        out.push(new Date(at));
      }
    }
    cur.setDate(cur.getDate() + 1);
  }
  out.sort((a, b) => a.getTime() - b.getTime());
  return out;
}

export function scheduleSlotsValidationError(slots: GroupScheduleEntry[]): string | null {
  for (const s of slots) {
    const dur = slotDurationMinutes(s.startTime, s.endTime);
    if (dur <= 0) {
      return 'Each weekly slot must have an end time after its start time.';
    }
    if (dur < 15 || dur > 240) {
      return 'Each lesson length must be between 15 and 240 minutes.';
    }
  }
  return null;
}

export function formatPreviewRow(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
