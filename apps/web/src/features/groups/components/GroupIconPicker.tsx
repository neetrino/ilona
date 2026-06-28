'use client';

import { GROUP_ICON_DEFINITIONS, type GroupIconKey } from '@ilona/types';
import { cn } from '@/shared/lib/utils';
import { getGroupIconComponent } from '../group-icon-registry';

interface GroupIconPickerProps {
  value: GroupIconKey | null;
  onChange: (key: GroupIconKey | null) => void;
  /** When true, the Default tile picks a random icon instead of clearing selection. */
  defaultSelectsRandom?: boolean;
  disabled?: boolean;
  adminControls?: boolean;
  id?: string;
  'aria-labelledby'?: string;
}

function pickRandomGroupIconKey(exclude?: GroupIconKey | null): GroupIconKey {
  const pool = exclude
    ? GROUP_ICON_DEFINITIONS.filter((def) => def.key !== exclude)
    : GROUP_ICON_DEFINITIONS;
  const index = Math.floor(Math.random() * pool.length);
  return (pool[index] ?? GROUP_ICON_DEFINITIONS[0]).key;
}

/**
 * Single-select grid of predefined group icons plus a default (no icon) option.
 */
export function GroupIconPicker({
  value,
  onChange,
  defaultSelectsRandom = false,
  disabled,
  adminControls = false,
  id,
  'aria-labelledby': ariaLabelledBy,
}: GroupIconPickerProps) {
  const handleDefaultClick = () => {
    if (defaultSelectsRandom) {
      onChange(pickRandomGroupIconKey(value));
      return;
    }
    onChange(null);
  };

  const isDefaultSelected = !defaultSelectsRandom && value === null;
  const tileRadiusClass = adminControls ? 'rounded-[15px]' : 'rounded-lg';

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
        aria-checked={isDefaultSelected}
        disabled={disabled}
        onClick={handleDefaultClick}
        className={cn(
          'flex aspect-square items-center justify-center border text-xs font-medium transition-colors focus:outline-none',
          tileRadiusClass,
          isDefaultSelected
            ? 'border-2 border-primary bg-primary/10 text-primary'
            : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
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
              'flex aspect-square items-center justify-center border transition-colors focus:outline-none',
              tileRadiusClass,
              selected
                ? 'border-2 border-primary bg-primary/10'
                : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
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
