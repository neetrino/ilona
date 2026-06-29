'use client';

import { cn } from '@/shared/lib/utils';
import {
  DROPDOWN_CHEVRON_CLASS,
  DROPDOWN_CHEVRON_SELECTED_CLASS,
  DROPDOWN_LABEL_CLASS,
  DROPDOWN_PLACEHOLDER_TEXT_CLASS,
  DROPDOWN_TRIGGER_BASE_CLASS,
  DROPDOWN_TRIGGER_DISABLED_CLASS,
  DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
  DROPDOWN_TRIGGER_OPEN_CLASS,
  DROPDOWN_TRIGGER_SELECTED_CLASS,
  DROPDOWN_VALUE_TEXT_CLASS,
} from '../dropdown-theme';

interface SingleSelectDropdownTriggerProps {
  label?: string;
  labelId?: string;
  triggerId: string;
  listboxId: string;
  displayText: string;
  hasSelection: boolean;
  isOpen: boolean;
  isLoading: boolean;
  disabled: boolean;
  error: string | null;
  triggerClassName?: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}

export function SingleSelectDropdownTrigger({
  label,
  labelId,
  triggerId,
  listboxId,
  displayText,
  hasSelection,
  isOpen,
  isLoading,
  disabled,
  error,
  triggerClassName,
  triggerRef,
  onPointerDown,
  onKeyDown,
}: SingleSelectDropdownTriggerProps) {
  return (
    <>
      {label && (
        <label id={labelId} htmlFor={triggerId} className={DROPDOWN_LABEL_CLASS}>
          {label}
        </label>
      )}
      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        disabled={isLoading || disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={label ? `${labelId} ${triggerId}` : undefined}
        className={cn(
          DROPDOWN_TRIGGER_BASE_CLASS,
          DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
          DROPDOWN_TRIGGER_DISABLED_CLASS,
          hasSelection && !isOpen && DROPDOWN_TRIGGER_SELECTED_CLASS,
          isOpen && DROPDOWN_TRIGGER_OPEN_CLASS,
          error && 'border-red-500',
          triggerClassName,
        )}
      >
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span
            className={cn(
              'truncate text-sm',
              hasSelection ? DROPDOWN_VALUE_TEXT_CLASS : DROPDOWN_PLACEHOLDER_TEXT_CLASS,
            )}
          >
            {isLoading ? 'Loading...' : displayText}
          </span>
          <svg
            className={cn(
              DROPDOWN_CHEVRON_CLASS,
              hasSelection && DROPDOWN_CHEVRON_SELECTED_CLASS,
              isOpen && 'rotate-180',
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
    </>
  );
}
