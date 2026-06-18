'use client';

import { useState, useRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { usePortalShell } from '@/shared/context/portal-shell-context';
import { portalLabelClass, portalInputClass } from '@/shared/lib/portal-theme';
import { Checkbox } from './checkbox';
import {
  DROPDOWN_CHEVRON_CLASS,
  DROPDOWN_LABEL_CLASS,
  DROPDOWN_MENU_SURFACE_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
  DROPDOWN_PLACEHOLDER_TEXT_CLASS,
  DROPDOWN_TRIGGER_BASE_CLASS,
  DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
  DROPDOWN_VALUE_TEXT_CLASS,
} from './dropdown-theme';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  placeholder?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function FilterDropdown({
  label,
  options,
  selectedIds,
  onSelectionChange,
  placeholder = 'All',
  isLoading = false,
  error = null,
  className,
}: FilterDropdownProps) {
  const isPortal = usePortalShell();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsidePress(dropdownRef, () => setIsOpen(false));

  const handleToggle = (optionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    onSelectionChange(newSelected);
  };

  const getDisplayText = () => {
    if (selectedIds.size === 0) {
      return placeholder;
    }
    if (selectedIds.size === 1) {
      const selected = options.find((opt) => selectedIds.has(opt.id));
      return selected?.label || placeholder;
    }
    return `${selectedIds.size} selected`;
  };

  return (
    <div className={cn('relative min-w-0', className)} ref={dropdownRef}>
      <label className={isPortal ? portalLabelClass : DROPDOWN_LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={cn(
            isPortal
              ? cn(portalInputClass, 'flex items-center justify-between text-left')
              : cn(
                  'flex min-h-11 w-full items-center justify-between',
                  DROPDOWN_TRIGGER_BASE_CLASS,
                  DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
                ),
            'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span
              className={cn(
                'truncate text-sm',
                isPortal
                  ? selectedIds.size === 0
                    ? 'text-[#8b8b90]'
                    : 'text-[#3b3b40]'
                  : selectedIds.size === 0
                    ? DROPDOWN_PLACEHOLDER_TEXT_CLASS
                    : DROPDOWN_VALUE_TEXT_CLASS,
              )}
            >
              {isLoading ? 'Loading...' : getDisplayText()}
            </span>
            <svg
              className={cn(
                'h-4 w-4 shrink-0 transition-transform',
                isPortal ? 'text-[#8b8b90]' : DROPDOWN_CHEVRON_CLASS,
                isOpen && 'rotate-180',
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div
            className={cn(
              'mt-1 max-h-60 w-full',
              isPortal
                ? 'absolute z-50 overflow-auto rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] bg-white shadow-lg'
                : cn(DROPDOWN_MENU_SURFACE_CLASS, 'absolute'),
            )}
          >
            {error ? (
              <div className="p-3 text-sm text-[#ff2e23]">{error}</div>
            ) : options.length === 0 ? (
              <div className={cn('p-3 text-sm', isPortal ? 'text-[#8b8b90]' : 'text-slate-500')}>
                No options available
              </div>
            ) : (
              <div className="space-y-1 px-1 py-1">
                {options.map((option) => {
                  const isSelected = selectedIds.has(option.id);
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        'flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 transition-colors',
                        isPortal ? 'hover:bg-[#fafafa]' : 'hover:bg-slate-50',
                        isSelected && (isPortal ? 'bg-[#f0f0fc]' : DROPDOWN_OPTION_SELECTED_CLASS),
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(option.id)}
                      />
                      <span
                        className={cn(
                          'ml-3 select-none text-sm truncate',
                          isPortal ? 'text-[#3b3b40]' : 'text-slate-700',
                        )}
                      >
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}








