'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { GroupScheduleEntry } from '../types';

const DAY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

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

export function GroupScheduleEditor({ value, onChange, disabled }: GroupScheduleEditorProps) {
  const updateEntry = (index: number, patch: Partial<GroupScheduleEntry>) => {
    const next = value.map((e, i) => (i === index ? { ...e, ...patch } : e));
    onChange(next);
  };

  const removeEntry = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addEntry = () => onChange([...value, { ...DEFAULT_ENTRY }]);

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-xs text-slate-500">No working hours added yet.</p>
      )}
      {value.map((entry, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2"
        >
          <select
            value={entry.dayOfWeek}
            onChange={(e) => updateEntry(i, { dayOfWeek: Number(e.target.value) })}
            disabled={disabled}
            className="col-span-4 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            aria-label="Day of week"
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={entry.startTime}
            onChange={(e) => updateEntry(i, { startTime: e.target.value })}
            disabled={disabled}
            className="col-span-3 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            aria-label="Start time"
          />
          <input
            type="time"
            value={entry.endTime}
            onChange={(e) => updateEntry(i, { endTime: e.target.value })}
            disabled={disabled}
            className="col-span-3 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            aria-label="End time"
          />
          <button
            type="button"
            onClick={() => removeEntry(i)}
            disabled={disabled}
            className="col-span-2 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
            aria-label="Remove schedule entry"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
      >
        <Plus className="size-3.5" /> Add slot
      </button>
    </div>
  );
}
