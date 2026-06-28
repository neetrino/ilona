'use client';

import { cn } from '@/shared/lib/utils';
import type { ViewMode } from '@/features/attendance/utils/dateUtils';
import { useTranslations } from 'next-intl';
import {
  getSegmentedIndicatorStyle,
  SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS,
  SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
  SEGMENTED_TOGGLE_GRID_BUTTON_CLASS,
  SEGMENTED_TOGGLE_GRID_TRACK_CLASS,
  SEGMENTED_TOGGLE_INDICATOR_CLASS,
  SEGMENTED_TOGGLE_TRACK_PADDING_PX,
} from '@/shared/components/ui/segmented-toggle-theme';

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
  availableModes?: ViewMode[];
  variant?: 'default' | 'teacher';
}

export function ViewModeSelector({
  value,
  onChange,
  disabled,
  availableModes,
  variant = 'default',
}: ViewModeSelectorProps) {
  const t = useTranslations('attendance');
  const tc = useTranslations('common');
  const isTeacher = variant === 'teacher';

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
  const optionCount = Math.max(1, modes.length);

  return (
    <div
      role="group"
      aria-label={tc('viewMode')}
      className={cn(
        isTeacher
          ? 'relative grid h-11 min-h-11 min-w-[190px] items-stretch rounded-lg border border-[rgba(14,14,16,0.12)] bg-[#f6f6f7] p-1 shadow-sm sm:min-w-[220px] lg:rounded-[15px]'
          : cn(SEGMENTED_TOGGLE_GRID_TRACK_CLASS, 'min-w-[190px] sm:min-w-[220px]'),
      )}
      style={{ gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className={cn(
          isTeacher ? 'pointer-events-none absolute z-0 rounded-md bg-[#1010a3] shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:rounded-[11px]' : SEGMENTED_TOGGLE_INDICATOR_CLASS,
        )}
        style={getSegmentedIndicatorStyle(
          selectedIndex,
          optionCount,
          SEGMENTED_TOGGLE_TRACK_PADDING_PX,
        )}
      />
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => !disabled && onChange(mode.id)}
          disabled={disabled}
          className={cn(
            SEGMENTED_TOGGLE_GRID_BUTTON_CLASS,
            'whitespace-nowrap duration-300 px-3 sm:px-4',
            value === mode.id
              ? SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS
              : isTeacher
                ? 'text-[#3b3b40] hover:text-[#1010a3]'
                : cn(SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS, 'text-slate-700 hover:text-[#1010a3]'),
            disabled && 'cursor-not-allowed opacity-50',
          )}
          aria-pressed={value === mode.id}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
