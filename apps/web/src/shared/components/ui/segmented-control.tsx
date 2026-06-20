'use client';

import { cn } from '@/shared/lib/utils';

export interface SegmentedControlOption {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowDeselect?: boolean;
  className?: string;
  'aria-label'?: string;
}

const TRACK_PADDING_PX = 2;

export function SegmentedControl({
  options,
  value,
  onChange,
  disabled = false,
  allowDeselect = false,
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps) {
  const selectedIndex = options.findIndex((option) => option.id === value);
  const optionCount = Math.max(1, options.length);
  const segmentShare = 100 / optionCount;
  const compact = options.length > 4;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'relative grid h-11 w-full rounded-xl border border-[rgba(14,14,16,0.08)] bg-white p-0.5',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))` }}
    >
      {selectedIndex >= 0 ? (
        <span
          aria-hidden
          className="pointer-events-none absolute z-0 rounded-[0.625rem] bg-[#1010a3] shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            top: TRACK_PADDING_PX,
            bottom: TRACK_PADDING_PX,
            left: `calc(${selectedIndex * segmentShare}% + ${TRACK_PADDING_PX}px)`,
            width: `calc(${segmentShare}% - ${TRACK_PADDING_PX * 2}px)`,
          }}
        />
      ) : null}
      {options.map((option) => {
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              if (disabled) return;
              if (allowDeselect && isSelected) {
                onChange('');
                return;
              }
              onChange(option.id);
            }}
            disabled={disabled}
            className={cn(
              'relative z-10 flex h-full min-w-0 items-center justify-center rounded-[0.625rem] px-0.5 text-center font-semibold leading-none tabular-nums whitespace-nowrap transition-colors focus:outline-none',
              compact ? 'text-xs' : 'text-sm',
              isSelected ? 'text-white' : 'text-slate-700 hover:text-[#1010a3]',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-pressed={isSelected}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
