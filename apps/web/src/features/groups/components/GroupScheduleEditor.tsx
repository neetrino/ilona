'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GroupScheduleEntry } from '../types';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';

const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0] as const;

interface GroupScheduleEditorProps {
  value: GroupScheduleEntry[];
  onChange: (next: GroupScheduleEntry[]) => void;
  disabled?: boolean;
}

const DEFAULT_ENTRY: GroupScheduleEntry = {
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:00',
};

const MAX_SCHEDULE_SLOTS = DAY_VALUES.length;

export function GroupScheduleEditor({ value, onChange, disabled }: GroupScheduleEditorProps) {
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

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-xs text-slate-500">{t('scheduleNoWorkingHours')}</p>
      )}
      {value.map((entry, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2"
        >
          <div className="col-span-4">
            <SingleSelectDropdown
              id={`schedule-day-${i}`}
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
            className="col-span-3 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            aria-label={t('scheduleStartTime')}
          />
          <input
            type="time"
            value={entry.endTime}
            onChange={(e) => updateEntry(i, { endTime: e.target.value })}
            disabled={disabled}
            className="col-span-3 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            aria-label={t('scheduleEndTime')}
          />
          <button
            type="button"
            onClick={() => removeEntry(i)}
            disabled={disabled}
            className="col-span-2 inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100 hover:border-red-300 disabled:opacity-50"
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
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
        >
          <Plus className="size-3.5" /> {t('scheduleAddSlot')}
        </button>
      )}
    </div>
  );
}
