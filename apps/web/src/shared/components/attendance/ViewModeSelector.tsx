'use client';

import { cn } from '@/shared/lib/utils';
import type { ViewMode } from '@/features/attendance/utils/dateUtils';
import { useTranslations } from 'next-intl';

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
  availableModes?: ViewMode[];
}

export function ViewModeSelector({ value, onChange, disabled, availableModes }: ViewModeSelectorProps) {
  const t = useTranslations('attendance');

  const allModes: { id: ViewMode; label: string }[] = [
    { id: 'day', label: t('viewModeDay') },
    { id: 'week', label: t('viewModeWeek') },
    { id: 'month', label: t('viewModeMonth') },
  ];
  const modes = availableModes
    ? allModes.filter((mode) => availableModes.includes(mode.id))
    : allModes;

  const selectedIndex = Math.max(
    0,
    modes.findIndex((mode) => mode.id === value),
  );
  const segmentWidth = modes.length > 0 ? 100 / modes.length : 100;

  return (
    <div
      className="relative grid min-w-[190px] rounded-lg border-2 border-slate-300 bg-white p-1 shadow-sm sm:min-w-[220px]"
      style={{ gridTemplateColumns: `repeat(${Math.max(1, modes.length)}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-1 left-1 top-1 z-0 rounded-md bg-[#1010a3] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `calc(${segmentWidth}% - 0.166rem)`,
          transform: `translateX(${selectedIndex * 100}%)`,
        }}
      />
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => !disabled && onChange(mode.id)}
          disabled={disabled}
          className={cn(
            'relative z-10 flex items-center justify-center rounded-md px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none sm:px-4',
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










