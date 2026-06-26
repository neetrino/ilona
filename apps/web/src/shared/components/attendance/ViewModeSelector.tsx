'use client';

import { cn } from '@/shared/lib/utils';
import type { ViewMode } from '@/features/attendance/utils/dateUtils';
import { useTranslations } from 'next-intl';

const TEACHER_TRACK_PADDING_PX = 4;

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
  const segmentShare = 100 / optionCount;

  return (
    <div
      role="group"
      aria-label={tc('viewMode')}
      className={cn(
        'relative grid',
        isTeacher
          ? 'min-w-[190px] rounded-lg border border-[rgba(14,14,16,0.12)] bg-[#f6f6f7] p-1 shadow-sm sm:min-w-[220px]'
          : 'min-w-[190px] rounded-lg border-2 border-slate-300 bg-white p-1 shadow-sm sm:min-w-[220px]',
      )}
      style={{ gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))` }}
    >
      {isTeacher ? (
        <span
          aria-hidden
          className="pointer-events-none absolute z-0 rounded-md bg-[#1010a3] shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            top: TEACHER_TRACK_PADDING_PX,
            bottom: TEACHER_TRACK_PADDING_PX,
            left: `calc(${selectedIndex * segmentShare}% + ${TEACHER_TRACK_PADDING_PX}px)`,
            width: `calc(${segmentShare}% - ${TEACHER_TRACK_PADDING_PX * 2}px)`,
          }}
        />
      ) : (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-1 left-1 top-1 z-0 rounded-md bg-[#1010a3] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: `calc(${segmentShare}% - 0.166rem)`,
            transform: `translateX(${selectedIndex * 100}%)`,
          }}
        />
      )}
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => !disabled && onChange(mode.id)}
          disabled={disabled}
          className={cn(
            'relative z-10 flex items-center justify-center rounded-md text-sm font-semibold whitespace-nowrap transition-colors duration-300 focus:outline-none',
            isTeacher ? 'px-3 py-2 sm:px-4' : 'px-3 py-2.5 sm:px-4',
            value === mode.id
              ? 'text-white'
              : isTeacher
                ? 'text-[#3b3b40] hover:text-[#1010a3]'
                : 'text-slate-700 hover:text-[#1010a3]',
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
