'use client';

import { cn } from '@/shared/lib/utils';
import {
  getSegmentedIndicatorStyle,
  SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS,
  SEGMENTED_TOGGLE_BUTTON_CLASS,
  SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
  SEGMENTED_TOGGLE_GRID_TRACK_CLASS,
  SEGMENTED_TOGGLE_INDICATOR_CLASS,
  SEGMENTED_TOGGLE_TRACK_PADDING_PX,
} from './segmented-toggle-theme';

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
  const compact = options.length > 4;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(SEGMENTED_TOGGLE_GRID_TRACK_CLASS, 'h-11 w-full', className)}
      style={{ gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))` }}
    >
      {selectedIndex >= 0 ? (
        <span
          aria-hidden
          className={SEGMENTED_TOGGLE_INDICATOR_CLASS}
          style={getSegmentedIndicatorStyle(
            selectedIndex,
            optionCount,
            SEGMENTED_TOGGLE_TRACK_PADDING_PX,
          )}
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
              SEGMENTED_TOGGLE_BUTTON_CLASS,
              'min-w-0 font-semibold whitespace-nowrap',
              compact ? 'px-0.5 text-xs tabular-nums' : 'px-2 text-sm sm:px-3',
              isSelected ? SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS : SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
              !isSelected && 'hover:text-[#1010a3]',
              disabled && 'cursor-not-allowed opacity-50',
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
