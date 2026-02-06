'use client';

import { cn } from '@/shared/lib/utils';
import type { ViewMode } from '@/features/attendance/utils/dateUtils';

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
}

export function ViewModeSelector({ value, onChange, disabled }: ViewModeSelectorProps) {
  const modes: { id: ViewMode; label: string }[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ];

  return (
    <div className="inline-flex rounded-lg border-2 border-slate-300 bg-white p-1 shadow-sm">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => !disabled && onChange(mode.id)}
          disabled={disabled}
          className={cn(
            'px-4 py-2 text-sm font-semibold rounded-md transition-all',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            value === mode.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-pressed={value === mode.id}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}






