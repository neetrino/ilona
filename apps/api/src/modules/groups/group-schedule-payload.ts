import { createHash } from 'crypto';
import { Prisma } from '@ilona/database';

/** One weekly recurring slot (matches group JSON / DTO). */
export interface GroupWeeklySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  notes?: string;
}

/** Calendar generation metadata stored inside group.schedule JSON. */
export interface GroupCalendarStored {
  dateFrom: string;
  dateTo: string;
  topic?: string;
  description?: string;
  generationKey?: string;
  suppressedSlotStarts?: string[];
}

export type GroupScheduleStored =
  | GroupWeeklySlot[]
  | {
      weeklySlots: GroupWeeklySlot[];
      calendar?: GroupCalendarStored;
    };

export function parseGroupSchedulePayload(raw: unknown): {
  weeklySlots: GroupWeeklySlot[];
  calendar: GroupCalendarStored | null;
} {
  if (raw == null) {
    return { weeklySlots: [], calendar: null };
  }
  if (Array.isArray(raw)) {
    return { weeklySlots: raw as GroupWeeklySlot[], calendar: null };
  }
  if (typeof raw === 'object' && raw !== null && 'weeklySlots' in raw) {
    const o = raw as { weeklySlots?: GroupWeeklySlot[]; calendar?: GroupCalendarStored };
    return {
      weeklySlots: Array.isArray(o.weeklySlots) ? o.weeklySlots : [],
      calendar: o.calendar ?? null,
    };
  }
  return { weeklySlots: [], calendar: null };
}

export function computeGenerationKey(
  teacherId: string,
  secondTeacherId: string,
  weeklySlots: GroupWeeklySlot[],
  dateFrom: string,
  dateTo: string,
  secondTeacherStartsFirstWeek = false,
): string {
  const normalized = [...weeklySlots]
    .map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    }))
    .sort(
      (a, b) =>
        a.dayOfWeek - b.dayOfWeek ||
        a.startTime.localeCompare(b.startTime) ||
        a.endTime.localeCompare(b.endTime),
    );
  return createHash('sha256')
    .update(
      JSON.stringify({
        teacherId,
        secondTeacherId,
        secondTeacherStartsFirstWeek,
        normalized,
        dateFrom,
        dateTo,
      }),
    )
    .digest('hex');
}

export function buildScheduleJson(
  weeklySlots: GroupWeeklySlot[],
  calendar: GroupCalendarStored | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (weeklySlots.length === 0 && !calendar) {
    return undefined;
  }
  if (!calendar) {
    return weeklySlots.length > 0
      ? (weeklySlots as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull;
  }
  return {
    weeklySlots,
    calendar,
  } as unknown as Prisma.InputJsonValue;
}
