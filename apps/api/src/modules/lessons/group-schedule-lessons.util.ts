import { BadRequestException } from '@nestjs/common';
import {
  endOfZonedDay,
  enumerateYmdRange,
  startOfZonedDay,
  wallTimeToUtc,
  ymdWeekday,
} from '@ilona/types';
import type { GroupWeeklySlot } from '../groups/group-schedule-payload';
import { GROUP_SCHEDULE_MAX_OCCURRENCES } from '../groups/group-schedule-rolling';

export function assertValidYmd(ymd: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd) || Number.isNaN(Date.parse(`${ymd}T00:00:00Z`))) {
    throw new BadRequestException(`Invalid calendar date: ${ymd}`);
  }
}

export function slotDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function enumerateOccurrences(
  weeklySlots: GroupWeeklySlot[],
  dateFromYmd: string,
  dateToYmd: string,
): Array<{ at: Date; duration: number; slot: GroupWeeklySlot }> {
  assertValidYmd(dateFromYmd);
  assertValidYmd(dateToYmd);
  const startDay = startOfZonedDay(dateFromYmd);
  const endBoundary = endOfZonedDay(dateToYmd);
  const out: Array<{ at: Date; duration: number; slot: GroupWeeklySlot }> = [];

  for (const ymd of enumerateYmdRange(dateFromYmd, dateToYmd)) {
    const dow = ymdWeekday(ymd);
    for (const slot of weeklySlots) {
      if (slot.dayOfWeek !== dow) continue;
      const dur = slotDurationMinutes(slot.startTime, slot.endTime);
      if (dur <= 0) {
        throw new BadRequestException('End time must be after start time for each weekly slot');
      }
      if (dur < 15 || dur > 240) {
        throw new BadRequestException('Each slot must be between 15 and 240 minutes');
      }
      const at = wallTimeToUtc(ymd, slot.startTime);
      if (at >= startDay && at <= endBoundary) {
        out.push({ at, duration: dur, slot });
      }
    }
  }
  out.sort((a, b) => a.at.getTime() - b.at.getTime());
  return out;
}

export function assertOccurrenceBatchSize(count: number): void {
  if (count > GROUP_SCHEDULE_MAX_OCCURRENCES) {
    throw new BadRequestException(
      `Cannot generate more than ${GROUP_SCHEDULE_MAX_OCCURRENCES} lessons at once. Narrow the date range or weekdays.`,
    );
  }
}

export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function minDate(a: Date, b: Date): Date {
  return a.getTime() <= b.getTime() ? a : b;
}

export function maxDate(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}
