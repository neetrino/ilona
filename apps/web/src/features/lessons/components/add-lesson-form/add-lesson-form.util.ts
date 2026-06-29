import { scheduleSlotsValidationError } from '@/features/groups/group-schedule-utils';
import type { GroupScheduleEntry } from '@/features/groups/types';
import type { Group } from '@/features/groups/types';

export function translateScheduleSlotError(
  err: string | null,
  tVal: (key: 'slotEndAfterStart' | 'slotDuration') => string,
): string | null {
  if (!err) return null;
  if (err.includes('end time after')) return tVal('slotEndAfterStart');
  if (err.includes('between 15 and 240')) return tVal('slotDuration');
  return err;
}

export function groupSlotsForRecurring(
  slots: GroupScheduleEntry[],
): Array<{ startTime: string; endTime: string; weekdays: number[] }> {
  const map = new Map<string, { startTime: string; endTime: string; weekdays: number[] }>();
  for (const slot of slots) {
    const key = `${slot.startTime}|${slot.endTime}`;
    const existing = map.get(key);
    if (existing) {
      if (!existing.weekdays.includes(slot.dayOfWeek)) {
        existing.weekdays.push(slot.dayOfWeek);
      }
    } else {
      map.set(key, {
        startTime: slot.startTime,
        endTime: slot.endTime,
        weekdays: [slot.dayOfWeek],
      });
    }
  }
  return Array.from(map.values());
}

export function getGroupTeacherId(group: Group): string | null {
  return group.teacherId ?? group.teacher?.id ?? null;
}

export function validateAddLessonSchedule(params: {
  schedule: GroupScheduleEntry[];
  dateFrom: string;
  dateTo: string;
  tVal: (key: string) => string;
  tGroupsForm: (key: string) => string;
  tGroupsVal: (key: 'slotEndAfterStart' | 'slotDuration') => string;
}): string | null {
  const { schedule, dateFrom, dateTo, tVal, tGroupsForm, tGroupsVal } = params;
  if (schedule.length < 1) {
    return tVal('weekdaysRequired');
  }
  const slotErr = translateScheduleSlotError(scheduleSlotsValidationError(schedule), tGroupsVal);
  if (slotErr) return slotErr;
  if (!dateFrom || !dateTo) {
    return tGroupsForm('chooseCalendarDateRange');
  }
  if (dateTo < dateFrom) {
    return tGroupsForm('endDateOnOrAfterStart');
  }
  return null;
}
