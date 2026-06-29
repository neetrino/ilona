'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { GROUP_ICON_DEFINITIONS, type GroupIconKey } from '@ilona/types';
import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
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

export function GroupIconPicker({
  value,
  onChange,
  defaultSelectsRandom = false,
  disabled,
  adminControls = false,
  id,
  'aria-labelledby': ariaLabelledBy,
}: GroupIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedDef = value ? GROUP_ICON_DEFINITIONS.find((def) => def.key === value) : null;
  const SelectedIcon = value ? getGroupIconComponent(value) : null;
  const previewLabel = selectedDef?.label ?? 'Default';
  const tileRadiusClass = adminControls ? 'rounded-[15px]' : 'rounded-lg';
  const isDefaultSelected = !defaultSelectsRandom && value === null;

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown, true);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [isOpen]);

  const selectIcon = useCallback(
    (key: GroupIconKey | null) => {
      onChange(key);
    },
    [onChange],
  );

  const handleDefaultClick = () => {
    if (defaultSelectsRandom) {
      onChange(pickRandomGroupIconKey(value));
    } else {
      onChange(null);
    }
  };

  const triggerClass = adminControls
    ? cn(ADMIN_FORM_INPUT_CLASS, 'flex w-full items-center justify-between gap-2 px-3 text-left')
    : cn(
        'flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left hover:border-slate-300',
      );

  return (
    <div ref={rootRef} id={id} className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={ariaLabelledBy}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(triggerClass, disabled && 'cursor-not-allowed opacity-50')}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center border border-slate-200 bg-slate-50',
              tileRadiusClass,
            )}
          >
            {SelectedIcon ? (
              <SelectedIcon className="text-slate-700" size={16} strokeWidth={1.75} aria-hidden />
            ) : (
              <span className="text-[10px] font-medium text-slate-500">Def</span>
            )}
          </span>
          <span className="truncate text-sm text-[#3b3b40]">{previewLabel}</span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-slate-500 transition-transform', isOpen && 'rotate-180')}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <div
          role="radiogroup"
          aria-labelledby={ariaLabelledBy}
          className="grid max-h-48 grid-cols-5 gap-1.5 overflow-y-auto rounded-[15px] border border-slate-200 bg-slate-50/80 p-2 sm:grid-cols-6 md:grid-cols-8"
        >
          <button
            type="button"
            role="radio"
            aria-checked={isDefaultSelected}
            disabled={disabled}
            onClick={handleDefaultClick}
            className={cn(
              'flex aspect-square items-center justify-center border text-[10px] font-medium transition-colors focus:outline-none',
              tileRadiusClass,
              isDefaultSelected
                ? 'border-2 border-primary bg-primary/10 text-primary'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-white',
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
                onClick={() => selectIcon(def.key)}
                className={cn(
                  'flex aspect-square items-center justify-center border transition-colors focus:outline-none',
                  tileRadiusClass,
                  selected
                    ? 'border-2 border-primary bg-primary/10'
                    : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-white',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                {Icon ? (
                  <Icon
                    className={selected ? 'text-primary' : 'text-slate-700'}
                    size={18}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
