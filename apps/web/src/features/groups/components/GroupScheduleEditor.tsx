'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GroupScheduleEntry } from '../types';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import { cn } from '@/shared/lib/utils';

const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0] as const;

interface GroupScheduleEditorProps {
  value: GroupScheduleEntry[];
  onChange: (next: GroupScheduleEntry[]) => void;
  disabled?: boolean;
  adminControls?: boolean;
}

const DEFAULT_ENTRY: GroupScheduleEntry = {
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:00',
};

const MAX_SCHEDULE_SLOTS = DAY_VALUES.length;

export function GroupScheduleEditor({
  value,
  onChange,
  disabled,
  adminControls = false,
}: GroupScheduleEditorProps) {
  const t = useTranslations('groups');
  const tTeachers = useTranslations('teachers');

  const dayLabelByValue: Record<number, string> = {
    1: tTeachers('monday'),
    2: tTeachers('tuesday'),
    3: tTeachers('wednesday'),
    4: tTeachers('thursday'),
    5: tTeachers('friday'),
    6: tTeachers('saturday'),
    0: tTeachers('sunday'),
  };

  const dayDropdownOptions = DAY_VALUES.map((day) => ({
    id: String(day),
    label: dayLabelByValue[day],
  }));

  const updateEntry = (index: number, patch: Partial<GroupScheduleEntry>) => {
    const next = value.map((e, i) => (i === index ? { ...e, ...patch } : e));
    onChange(next);
  };

  const removeEntry = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addEntry = () => {
    if (value.length >= MAX_SCHEDULE_SLOTS) return;
    const nextDay = DAY_VALUES[value.length];
    onChange([...value, { ...DEFAULT_ENTRY, dayOfWeek: nextDay }]);
  };

  const canAddSlot = value.length < MAX_SCHEDULE_SLOTS;

  const timeInputClass = adminControls
    ? cn(ADMIN_FORM_INPUT_CLASS, 'col-span-3 px-2')
    : 'col-span-3 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm';

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-xs text-slate-500">{t('scheduleNoWorkingHours')}</p>
      )}
      {value.map((entry, i) => (
        <div
          key={i}
          className={cn(
            'grid grid-cols-12 gap-2 border border-slate-200 bg-slate-50/60 p-2',
            adminControls ? 'rounded-[15px]' : 'rounded-lg',
          )}
        >
          <div className="col-span-4">
            <SingleSelectDropdown
              id={`schedule-day-${i}`}
              triggerClassName={adminControls ? ADMIN_FORM_INPUT_CLASS : undefined}
              options={dayDropdownOptions}
              value={String(entry.dayOfWeek)}
              onValueChange={(nextValue) => {
                if (!nextValue) return;
                updateEntry(i, { dayOfWeek: Number(nextValue) });
              }}
              disabled={disabled}
              placeholder={t('scheduleDayPlaceholder')}
            />
          </div>
          <input
            type="time"
            value={entry.startTime}
            onChange={(e) => updateEntry(i, { startTime: e.target.value })}
            disabled={disabled}
            className={timeInputClass}
            aria-label={t('scheduleStartTime')}
          />
          <input
            type="time"
            value={entry.endTime}
            onChange={(e) => updateEntry(i, { endTime: e.target.value })}
            disabled={disabled}
            className={timeInputClass}
            aria-label={t('scheduleEndTime')}
          />
          <button
            type="button"
            onClick={() => removeEntry(i)}
            disabled={disabled}
            className={cn(
              'col-span-2 inline-flex items-center justify-center border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 hover:border-red-300 hover:bg-red-100 disabled:opacity-50',
              adminControls ? 'rounded-[15px]' : 'rounded-md',
            )}
            aria-label={t('scheduleRemoveEntry')}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      {canAddSlot && (
        <button
          type="button"
          onClick={addEntry}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-1 border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50',
            adminControls ? 'rounded-[15px]' : 'rounded-md',
          )}
        >
          <Plus className="size-3.5" /> {t('scheduleAddSlot')}
        </button>
      )}
    </div>
  );
}
