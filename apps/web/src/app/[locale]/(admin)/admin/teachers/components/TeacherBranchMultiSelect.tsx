'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { getErrorMessage } from '@/shared/lib/api';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  DROPDOWN_CHEVRON_CLASS,
  DROPDOWN_MENU_PORTAL_SURFACE_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
  DROPDOWN_PLACEHOLDER_TEXT_CLASS,
  DROPDOWN_TRIGGER_BASE_CLASS,
  DROPDOWN_TRIGGER_DISABLED_CLASS,
  DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
} from '@/shared/components/ui/dropdown-theme';

interface TeacherBranchMultiSelectProps {
  value: string[];
  options: Array<{ id: string; label: string }>;
  onChange: (centerIds: string[]) => Promise<void>;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

function areIdSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const id of a) {
    if (!b.has(id)) {
      return false;
    }
  }
  return true;
}

export function TeacherBranchMultiSelect({
  value,
  options,
  onChange,
  placeholder = 'Assign branch…',
  searchPlaceholder = 'Search…',
  disabled = false,
  className,
}: TeacherBranchMultiSelectProps) {
  const tCommon = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState<string[]>(value);
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set(value));
  const [searchQuery, setSearchQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const draftIdsRef = useRef(draftIds);
  const localValueRef = useRef(localValue);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  draftIdsRef.current = draftIds;
  localValueRef.current = localValue;

  const optionById = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    options.forEach((option) => map.set(option.id, option));
    return map;
  }, [options]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const closeDropdown = useCallback(async () => {
    setIsOpen(false);
    setSearchQuery('');

    const draft = draftIdsRef.current;
    const committed = new Set(localValueRef.current);
    if (areIdSetsEqual(draft, committed)) {
      return;
    }

    const nextIds = Array.from(draft).sort((a, b) => {
      const labelA = optionById.get(a)?.label ?? a;
      const labelB = optionById.get(b)?.label ?? b;
      return labelA.localeCompare(labelB);
    });
    const previous = localValueRef.current;

    setLocalValue(nextIds);
    setIsLoading(true);
    setError(null);

    try {
      await onChange(nextIds);
    } catch (err: unknown) {
      setLocalValue(previous);
      setDraftIds(new Set(previous));
      setError(getErrorMessage(err, 'Failed to update'));
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [onChange, optionById]);

  useEffect(() => {
    if (isOpen) {
      setDraftIds(new Set(localValueRef.current));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      setPosition(null);
      return;
    }

    function updatePosition() {
      if (!buttonRef.current) {
        return;
      }

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const viewportWidth = window.innerWidth;
      const estimatedDropdownHeight = 280;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const openBelow = spaceBelow >= Math.min(estimatedDropdownHeight, 180) || spaceBelow >= spaceAbove;

      let top = openBelow
        ? buttonRect.bottom + scrollY + 4
        : buttonRect.top + scrollY - estimatedDropdownHeight - 4;
      if (top < scrollY + 4) {
        top = scrollY + 4;
      }

      let left = buttonRect.left + scrollX;
      if (left + buttonRect.width > viewportWidth + scrollX - 4) {
        left = viewportWidth + scrollX - buttonRect.width - 4;
      }
      if (left < scrollX + 4) {
        left = scrollX + 4;
      }

      setPosition({
        top,
        left,
        width: buttonRect.width,
      });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    const timeoutId = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    function handleClickOutside(event: Event) {
      if (
        buttonRef.current?.contains(event.target as Node) ||
        menuRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      void closeDropdown();
    }

    const supportsPointer = 'PointerEvent' in window;
    const listenerDelay = setTimeout(() => {
      if (supportsPointer) {
        document.addEventListener('pointerdown', handleClickOutside);
      } else {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }
    }, 0);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      clearTimeout(timeoutId);
      clearTimeout(listenerDelay);
      if (supportsPointer) {
        document.removeEventListener('pointerdown', handleClickOutside);
      } else {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      }
    };
  }, [isOpen, closeDropdown]);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  const displayIds = isOpen ? draftIds : new Set(localValue);
  const selectedChips = useMemo(
    () =>
      Array.from(displayIds)
        .map((id) => optionById.get(id))
        .filter((option): option is { id: string; label: string } => Boolean(option))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [displayIds, optionById],
  );

  const handleToggle = (optionId: string) => {
    setDraftIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  };

  const dropdownMenu =
    isOpen && !disabled && !isLoading && position && typeof window !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            className={cn(DROPDOWN_MENU_PORTAL_SURFACE_CLASS, 'flex max-h-72 flex-col overflow-hidden')}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${Math.max(position.width, 220)}px`,
            }}
          >
            <div className="border-b border-slate-200 p-2">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-[#1010a3]/45 focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10"
              />
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setDraftIds(new Set(filteredOptions.map((option) => option.id)));
                }}
                className="text-xs font-medium text-[#1010a3] transition-colors hover:text-[#0d0d85]"
                disabled={filteredOptions.length === 0}
              >
                Select all (visible)
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setDraftIds(new Set());
                }}
                className="text-xs font-medium text-slate-600 transition-colors hover:text-slate-800"
                disabled={draftIds.size === 0}
              >
                Clear selection
              </button>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-slate-500">{tCommon('globalSearchEmpty')}</div>
              ) : (
                <div className="space-y-1 px-1 py-1">
                  {filteredOptions.map((option) => {
                    const isSelected = draftIds.has(option.id);
                    return (
                      <label
                        key={option.id}
                        className={cn(
                          'flex cursor-pointer items-center rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50',
                          isSelected && DROPDOWN_OPTION_SELECTED_CLASS,
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(option.id)}
                        />
                        <span className="ml-3 truncate text-sm text-slate-700">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (disabled || isLoading) {
            return;
          }
          if (isOpen) {
            void closeDropdown();
            return;
          }
          setIsOpen(true);
        }}
        disabled={disabled || isLoading}
        className={cn(
          'w-full min-h-11 py-1.5 text-left text-sm px-2',
          DROPDOWN_TRIGGER_BASE_CLASS,
          DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
          DROPDOWN_TRIGGER_DISABLED_CLASS,
          selectedChips.length === 0 && DROPDOWN_PLACEHOLDER_TEXT_CLASS,
          error && 'border-red-300 bg-red-50',
          isLoading && 'cursor-wait opacity-50',
        )}
        title={error ?? undefined}
      >
        <div className="flex items-start gap-2">
          <div className="flex max-h-20 flex-1 flex-wrap content-start items-center gap-1 overflow-y-auto">
            {isLoading ? (
              <span className="flex items-center gap-1 px-1 py-0.5 text-sm">
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {tCommon('loading')}
              </span>
            ) : selectedChips.length === 0 ? (
              <span className="px-1 py-1">{placeholder}</span>
            ) : (
              selectedChips.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex max-w-full items-center rounded-md border border-slate-200/80 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800"
                >
                  <span className="truncate max-w-[120px]">{option.label}</span>
                </span>
              ))
            )}
          </div>
          {!isLoading && (
            <svg
              className={cn(DROPDOWN_CHEVRON_CLASS, 'mt-1.5', isOpen && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>
      {dropdownMenu}
      {error ? (
        <div className="absolute -bottom-6 left-0 whitespace-nowrap text-xs text-red-600">{error}</div>
      ) : null}
    </div>
  );
}
