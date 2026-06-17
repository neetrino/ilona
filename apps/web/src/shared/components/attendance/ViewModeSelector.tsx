'use client';

import { cn } from '@/shared/lib/utils';
import type { ViewMode } from '@/features/attendance/utils/dateUtils';
import { useTranslations } from 'next-intl';

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
}

export function ViewModeSelector({ value, onChange, disabled }: ViewModeSelectorProps) {
  const t = useTranslations('attendance');

  const modes: { id: ViewMode; label: string }[] = [
    { id: 'day', label: t('viewModeDay') },
    { id: 'week', label: t('viewModeWeek') },
    { id: 'month', label: t('viewModeMonth') },
  ];

  return (
    <div className="relative grid grid-cols-3 rounded-lg border-2 border-slate-300 bg-white p-1 shadow-sm">
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute bottom-1 left-1 top-1 z-0 w-[calc(33.333%-0.166rem)] rounded-md bg-[#1010a3] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          value === 'day'
            ? 'translate-x-0'
            : value === 'week'
              ? 'translate-x-[100%]'
              : 'translate-x-[200%]'
        )}
      />
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => !disabled && onChange(mode.id)}
          disabled={disabled}
          className={cn(
            'relative z-10 flex items-center justify-center rounded-md px-2 py-2 text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none sm:px-4 sm:text-sm',
            value === mode.id
              ? 'text-white'
              : 'text-slate-700 hover:text-[#1010a3]',
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










