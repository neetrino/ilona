import { scheduleSlotsValidationError } from '../group-schedule-utils';
import type { GroupScheduleEntry } from '../types';
import { translateScheduleSlotError } from '../components/edit-group-form/edit-group-form.constants';

/**
 * Client-side checks before create/update group with calendar generation.
 * Returns a localized error string, or null when valid.
 */
export function validateGroupCalendarSchedule(params: {
  schedule: GroupScheduleEntry[];
  dateFrom: string;
  dateTo: string;
  /** When true, at least one weekly slot is required. */
  requireSlots: boolean;
  tForm: (key: string) => string;
  tVal: (key: 'slotEndAfterStart' | 'slotDuration') => string;
}): string | null {
  const { schedule, dateFrom, dateTo, requireSlots, tForm, tVal } = params;

  if (requireSlots && schedule.length < 1) {
    return tForm('addAtLeastOneWeeklySlot');
  }

  if (schedule.length === 0) {
    return null;
  }

  const slotErr = translateScheduleSlotError(scheduleSlotsValidationError(schedule), tVal);
  if (slotErr) return slotErr;

  if (!dateFrom || !dateTo) {
    return tForm('chooseCalendarDateRange');
  }

  if (dateTo < dateFrom) {
    return tForm('endDateOnOrAfterStart');
  }

  return null;
}
