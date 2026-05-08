'use client';

import { Label } from '@/shared/components/ui';
import type { GroupScheduleEntry } from '../types';
import { GroupScheduleEditor } from './GroupScheduleEditor';
import { scheduleSlotsValidationError } from '../group-schedule-utils';

export interface GroupCalendarScheduleSectionProps {
  schedule: GroupScheduleEntry[];
  onScheduleChange: (next: GroupScheduleEntry[]) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (next: string) => void;
  onDateToChange: (next: string) => void;
  disabled?: boolean;
}

export function GroupCalendarScheduleSection({
  schedule,
  onScheduleChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  disabled,
}: GroupCalendarScheduleSectionProps) {
  const slotError = schedule.length > 0 ? scheduleSlotsValidationError(schedule) : null;

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/40 p-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Calendar schedule</Label>
        <p className="text-xs text-slate-500">
          When the group has weekly time slots, lessons are generated in the admin calendar for the date range below.
          Manually deleted generated slots stay skipped until you confirm replacing the schedule.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="schedule-date-from">Start date</Label>
          <input
            id="schedule-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            disabled={disabled}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="schedule-date-to">End date</Label>
          <input
            id="schedule-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            disabled={disabled}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Weekly time slots</Label>
        <GroupScheduleEditor value={schedule} onChange={onScheduleChange} disabled={disabled} />
        {slotError && <p className="text-xs text-red-600">{slotError}</p>}
      </div>
    </div>
  );
}
