'use client';

import { GROUP_ICON_DEFINITIONS, type GroupIconKey } from '@ilona/types';
import { cn } from '@/shared/lib/utils';
import { getGroupIconComponent } from '../group-icon-registry';

interface GroupIconPickerProps {
  value: GroupIconKey | null;
  onChange: (key: GroupIconKey | null) => void;
  disabled?: boolean;
  id?: string;
  'aria-labelledby'?: string;
}

/**
 * Single-select grid of predefined group icons plus a default (no icon) option.
 */
export function GroupIconPicker({
  value,
  onChange,
  disabled,
  id,
  'aria-labelledby': ariaLabelledBy,
}: GroupIconPickerProps) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
      className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === null}
        disabled={disabled}
        onClick={() => onChange(null)}
        className={cn(
          'flex aspect-square items-center justify-center rounded-lg border text-xs font-medium transition-colors',
          value === null
            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-white'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        Default
      </button>
      {GROUP_ICON_DEFINITIONS.map((def) => {
        const Icon = getGroupIconComponent(def.key);
        const selected = value === def.key;
        return (
          <button
            key={def.key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={def.label}
            title={def.label}
            disabled={disabled || !Icon}
            onClick={() => onChange(def.key)}
            className={cn(
              'flex aspect-square items-center justify-center rounded-lg border transition-colors',
              selected
                ? 'border-primary bg-primary/10 ring-2 ring-primary/40 ring-offset-2 ring-offset-white'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {Icon ? (
              <Icon
                className={selected ? 'text-primary' : 'text-slate-700'}
                size={22}
                strokeWidth={1.75}
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
