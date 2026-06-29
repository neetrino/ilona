'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { cn, getContrastColor, lightenColor } from '@/shared/lib/utils';
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
import { TeacherBranchAssignConfirmDialog } from './TeacherBranchAssignConfirmDialog';
import { useTeacherBranchConfirm } from './useTeacherBranchConfirm';
import { usePortalSidebarCollapsed } from '@/shared/context/portal-shell-context';

interface TeacherBranchMultiSelectProps {
  teacherId: string;
  teacherName: string;
  value: string[];
  options: Array<{ id: string; label: string; colorHex?: string | null }>;
  onChange: (centerIds: string[]) => Promise<void>;
  placeholder?: string;
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
  teacherId,
  teacherName,
  value,
  options,
  onChange,
  placeholder = 'Assign branch…',
  disabled = false,
  className,
}: TeacherBranchMultiSelectProps) {
  const tCommon = useTranslations('common');
  const sidebarCollapsed = usePortalSidebarCollapsed();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState<string[]>(value);
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set(value));
  const openForConfirm = useCallback(() => {
    setIsOpen(true);
  }, []);
  const {
    confirmState,
    dismissConfirm,
    requestToggleBranch,
    requestSelectAllVisible,
    requestClearSelection,
    handleConfirm,
  } = useTeacherBranchConfirm({
    teacherId,
    teacherName,
    options,
    draftIds,
    setDraftIds,
    onConfirmOpen: openForConfirm,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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

    if (confirmState) {
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
      const optionCount = options.length === 0 ? 1 : options.length;
      const menuHeight =
        menuRef.current?.offsetHeight ??
        80 + optionCount * 42;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const openBelow = spaceBelow >= menuHeight || spaceBelow >= spaceAbove;

      let top = openBelow
        ? buttonRect.bottom + scrollY + 4
        : buttonRect.top + scrollY - menuHeight - 4;
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
    const rafId = requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

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
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      clearTimeout(listenerDelay);
      if (supportsPointer) {
        document.removeEventListener('pointerdown', handleClickOutside);
      } else {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      }
    };
  }, [isOpen, confirmState, closeDropdown, options.length]);

  const displayIds = isOpen ? draftIds : new Set(localValue);
  const selectedChips = useMemo(
    () =>
      Array.from(displayIds)
        .map((id) => optionById.get(id))
        .filter((option): option is { id: string; label: string; colorHex?: string | null } => Boolean(option))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [displayIds, optionById],
  );

  const handleToggle = (optionId: string) => {
    const option = optionById.get(optionId);
    if (!option) {
      return;
    }
    requestToggleBranch(option);
  };

  const isConfirmOpen = confirmState !== null;
  const useCollapsedBranchGrid = sidebarCollapsed && selectedChips.length >= 2;

  const dropdownMenu =
    isOpen && !isConfirmOpen && !disabled && !isLoading && position && typeof window !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            className={cn(
              DROPDOWN_MENU_PORTAL_SURFACE_CLASS,
              'flex flex-col !overflow-visible',
            )}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${Math.max(position.width, 220)}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  requestSelectAllVisible(options);
                }}
                className="text-xs font-medium text-[#1010a3] transition-colors hover:text-[#0d0d85]"
                disabled={options.every((option) => draftIds.has(option.id))}
              >
                Select all (visible)
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  requestClearSelection();
                }}
                className="text-xs font-medium text-slate-600 transition-colors hover:text-slate-800"
                disabled={draftIds.size === 0}
              >
                Clear selection
              </button>
            </div>
            <div>
              {options.length === 0 ? (
                <div className="p-3 text-sm text-slate-500">{tCommon('globalSearchEmpty')}</div>
              ) : (
                <div className="space-y-1 px-1 py-1">
                  {options.map((option) => {
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
          'w-full !h-auto min-h-11 py-2 text-left text-sm px-2',
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
          <div
            className={cn(
              'flex-1',
              useCollapsedBranchGrid
                ? 'grid grid-cols-2 gap-1.5'
                : 'flex flex-wrap content-start items-center gap-1',
            )}
          >
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
              selectedChips.map((option) => {
                const primaryColor = option.colorHex || '#253046';
                const softColor = lightenColor(primaryColor, 0.62);
                const borderColor = lightenColor(primaryColor, 0.35);
                const textColor =
                  getContrastColor(primaryColor) === 'white' ? '#1e293b' : '#334155';

                return (
                  <span
                    key={option.id}
                    className={cn(
                      'inline-flex max-w-full items-center rounded-xl text-[11px] font-semibold shadow-[0_1px_4px_rgba(15,23,42,0.05)]',
                      useCollapsedBranchGrid
                        ? 'h-full min-h-[28px] w-full min-w-0 justify-center px-1.5 py-1.5'
                        : 'px-2 py-0.5',
                    )}
                    style={{
                      backgroundColor: softColor,
                      color: textColor,
                      border: `1px solid ${borderColor}`,
                    }}
                  >
                    <span
                      className={cn(
                        useCollapsedBranchGrid
                          ? 'w-full text-center leading-tight break-words'
                          : 'max-w-[180px] truncate',
                      )}
                    >
                      {option.label}
                    </span>
                  </span>
                );
              })
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
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : null}
      <TeacherBranchAssignConfirmDialog
        state={confirmState}
        branchOptions={options}
        onOpenChange={(open) => {
          if (!open) {
            dismissConfirm();
          }
        }}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
