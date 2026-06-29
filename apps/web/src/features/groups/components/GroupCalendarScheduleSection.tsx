'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/shared/components/ui';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { ADMIN_DATE_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import { cn } from '@/shared/lib/utils';
import type { GroupScheduleEntry } from '../types';
import { GroupScheduleEditor } from './GroupScheduleEditor';
import { scheduleEndDateFromStart, scheduleSlotsValidationError } from '../group-schedule-utils';

export interface GroupCalendarScheduleSectionProps {
  schedule: GroupScheduleEntry[];
  onScheduleChange: (next: GroupScheduleEntry[]) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (next: string) => void;
  onDateToChange: (next: string) => void;
  disabled?: boolean;
  adminControls?: boolean;
}

export function GroupCalendarScheduleSection({
  schedule,
  onScheduleChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  disabled,
  adminControls = false,
}: GroupCalendarScheduleSectionProps) {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const slotError = schedule.length > 0 ? scheduleSlotsValidationError(schedule) : null;

  const handleDateFromChange = useCallback(
    (next: string) => {
      onDateFromChange(next);
      if (next) {
        onDateToChange(scheduleEndDateFromStart(next));
      }
    },
    [onDateFromChange, onDateToChange],
  );

  return (
    <div
      className={cn(
        'space-y-4 border border-slate-200 bg-slate-50/40 p-3',
        adminControls ? 'rounded-[15px]' : 'rounded-lg',
      )}
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('calendarSchedule')}</Label>
        <p className="text-xs text-slate-500">
          {t('scheduleHelperText')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="min-w-0 space-y-1">
          <Label htmlFor="schedule-date-from">{tCommon('from')}</Label>
          <DatePickerInput
            id="schedule-date-from"
            value={dateFrom}
            onValueChange={handleDateFromChange}
            disabled={disabled}
            className={cn(
              'w-full border border-slate-300 bg-white text-sm',
              adminControls ? ADMIN_DATE_INPUT_CLASS : 'rounded-md px-3 py-2',
            )}
          />
        </div>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="schedule-date-to">{tCommon('to')}</Label>
          <DatePickerInput
            id="schedule-date-to"
            value={dateTo}
            onValueChange={onDateToChange}
            disabled={disabled}
            className={cn(
              'w-full border border-slate-300 bg-white text-sm',
              adminControls ? ADMIN_DATE_INPUT_CLASS : 'rounded-md px-3 py-2',
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('weeklyTimeSlots')}</Label>
        <GroupScheduleEditor
          value={schedule}
          onChange={onScheduleChange}
          disabled={disabled}
          adminControls={adminControls}
        />
        {slotError && <p className="text-xs text-red-600">{slotError}</p>}
      </div>
    </div>
  );
}
