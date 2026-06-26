'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';
import {
  DROPDOWN_CHEVRON_CLASS,
  DROPDOWN_CHEVRON_SELECTED_CLASS,
  DROPDOWN_LABEL_CLASS,
  DROPDOWN_OPTION_BASE_CLASS,
  DROPDOWN_OPTION_INTERACTIVE_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
  DROPDOWN_PLACEHOLDER_TEXT_CLASS,
  DROPDOWN_TRIGGER_BASE_CLASS,
  DROPDOWN_TRIGGER_DISABLED_CLASS,
  DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
  DROPDOWN_TRIGGER_OPEN_CLASS,
  DROPDOWN_TRIGGER_SELECTED_CLASS,
  DROPDOWN_VALUE_TEXT_CLASS,
} from './dropdown-theme';

type MenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  positionMode: 'fixed' | 'absolute';
};

function resolvePortalContainer(root: HTMLElement | null): HTMLElement {
  if (!root) return document.body;
  const dialog = root.closest('[role="dialog"]');
  return (dialog as HTMLElement | null) ?? document.body;
}

export const SINGLE_SELECT_DROPDOWN_BACKDROP_ATTR = 'data-single-select-dropdown-backdrop';

export interface SingleSelectOption {
  id: string;
  label: string;
}

export const SINGLE_SELECT_DROPDOWN_MENU_ATTR = 'data-single-select-dropdown-menu';

/** Spread onto Radix Dialog.Content when the dialog contains portaled SingleSelectDropdown menus. */
export function preventDialogDismissOnPortaledDropdown(event: Event) {
  const target = event.target;
  if (
    target instanceof Element &&
    (target.closest(`[${SINGLE_SELECT_DROPDOWN_MENU_ATTR}]`) ||
      target.closest(`[${SINGLE_SELECT_DROPDOWN_BACKDROP_ATTR}]`))
  ) {
    event.preventDefault();
  }
}

export const portaledDropdownDialogHandlers = {
  onPointerDownOutside: preventDialogDismissOnPortaledDropdown,
  onInteractOutside: preventDialogDismissOnPortaledDropdown,
  onFocusOutside: preventDialogDismissOnPortaledDropdown,
};

interface SingleSelectDropdownProps {
  id?: string;
  label?: string;
  options: SingleSelectOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  allowDeselect?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  wrapText?: boolean;
}

export function SingleSelectDropdown({
  id,
  label,
  options,
  value,
  onValueChange,
  allowDeselect = false,
  placeholder = 'Select...',
  isLoading = false,
  error = null,
  className,
  triggerClassName,
  disabled = false,
  wrapText = false,
}: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generatedId = React.useId();
  const triggerId = id ?? `single-select-${generatedId}`;
  const labelId = label ? `${triggerId}-label` : undefined;
  const listboxId = `${triggerId}-listbox`;

  const hasSelection = Boolean(value);
  const selectedOption = options.find((opt) => opt.id === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const updateMenuPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const root = dropdownRef.current;
    if (!trigger) return;

    const portalTarget = resolvePortalContainer(root);
    setPortalContainer(portalTarget);
    const useDialogPortal = portalTarget !== document.body;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const shouldOpenUpward = useDialogPortal
      ? spaceBelow < 220 || (spaceAbove > spaceBelow && spaceBelow < 280)
      : spaceBelow < 220 && spaceAbove > spaceBelow;
    const availableSpace = Math.max(120, shouldOpenUpward ? spaceAbove : spaceBelow);
    const maxHeight = Math.min(320, Math.floor(availableSpace));

    setOpenUpward(shouldOpenUpward);

    if (useDialogPortal) {
      const dialogRect = portalTarget.getBoundingClientRect();
      setMenuPosition({
        positionMode: 'absolute',
        left: rect.left - dialogRect.left,
        width: rect.width,
        maxHeight,
        ...(shouldOpenUpward
          ? { bottom: dialogRect.bottom - rect.top + 6 }
          : { top: rect.bottom - dialogRect.top + 6 }),
      });
      return;
    }

    setMenuPosition({
      positionMode: 'fixed',
      left: rect.left,
      width: rect.width,
      maxHeight,
      ...(shouldOpenUpward
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      setPortalContainer(null);
      return;
    }

    updateMenuPosition();

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 0);

    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  const handleSelect = (optionId: string) => {
    const nextValue = allowDeselect && optionId === value ? null : optionId;
    onValueChange(nextValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        const selectedIndex = Math.max(0, options.findIndex((option) => option.id === value));
        setActiveIndex(selectedIndex);
        setIsOpen(true);
        return;
      }

      setActiveIndex((prev) => {
        if (options.length === 0) return -1;
        if (prev < 0) return 0;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        return (prev + step + options.length) % options.length;
      });
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen((prev) => !prev);
      if (!isOpen) {
        const selectedIndex = Math.max(0, options.findIndex((option) => option.id === value));
        setActiveIndex(selectedIndex);
      }
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === 'Tab') {
      setIsOpen(false);
      return;
    }

    if (options.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((prev) => {
        if (prev < 0) return 0;
        return (prev + step + options.length) % options.length;
      });
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    }

    if ((event.key === 'Enter' || event.key === ' ') && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(options[activeIndex].id);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const selectedIndex = options.findIndex((option) => option.id === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [isOpen, options, value]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.focus();
  }, [isOpen, activeIndex]);

  const useDialogPortal = portalContainer !== null && portalContainer !== document.body;
  const backdropPositionClass = useDialogPortal ? 'absolute' : 'fixed';

  return (
    <div className={cn('relative min-w-0', isOpen && 'z-[10001]', className)} ref={dropdownRef}>
      {label && (
        <label id={labelId} htmlFor={triggerId} className={DROPDOWN_LABEL_CLASS}>
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={triggerId}
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleTriggerKeyDown}
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
            triggerClassName
          )}
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className={cn(
              'text-sm',
              'truncate',
              hasSelection ? DROPDOWN_VALUE_TEXT_CLASS : DROPDOWN_PLACEHOLDER_TEXT_CLASS
            )}>
              {isLoading ? 'Loading...' : displayText}
            </span>
            <svg
              className={cn(
                DROPDOWN_CHEVRON_CLASS,
                hasSelection && DROPDOWN_CHEVRON_SELECTED_CLASS,
                isOpen && 'rotate-180'
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

        {isOpen &&
          menuPosition &&
          portalContainer &&
          typeof document !== 'undefined' &&
          createPortal(
            <>
              <div
                {...{ [SINGLE_SELECT_DROPDOWN_BACKDROP_ATTR]: '' }}
                className={cn(backdropPositionClass, 'inset-0 z-[9998]')}
                aria-hidden="true"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsOpen(false);
                }}
              />
              <div
                ref={menuRef}
                id={listboxId}
                {...{ [SINGLE_SELECT_DROPDOWN_MENU_ATTR]: '' }}
                role="listbox"
                aria-labelledby={labelId}
                tabIndex={-1}
                onKeyDown={handleMenuKeyDown}
                onPointerDown={(event) => event.stopPropagation()}
                style={{
                  position: menuPosition.positionMode,
                  zIndex: 9999,
                  left: `${menuPosition.left}px`,
                  width: `${menuPosition.width}px`,
                  maxHeight: `${menuPosition.maxHeight}px`,
                  ...(menuPosition.top !== undefined ? { top: `${menuPosition.top}px` } : {}),
                  ...(menuPosition.bottom !== undefined ? { bottom: `${menuPosition.bottom}px` } : {}),
                }}
                className={cn(
                  'pointer-events-auto overflow-y-auto rounded-xl border border-[rgba(14,14,16,0.08)] bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/5',
                  'animate-in fade-in-0 zoom-in-95 duration-150',
                  openUpward ? 'origin-bottom' : 'origin-top',
                )}
              >
              {error ? (
                <div className="p-3 text-sm text-red-600">{error}</div>
              ) : options.length === 0 ? (
                <div className="p-3 text-sm text-[#8b8b90]">No options available</div>
              ) : (
                <div className="space-y-1">
                  {options.map((option, index) => {
                    const isSelected = value === option.id;
                    return (
                      <button
                        id={`${listboxId}-option-${option.id}`}
                        key={option.id}
                        ref={(node) => {
                          optionRefs.current[index] = node;
                        }}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        title={option.label}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleSelect(option.id);
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          DROPDOWN_OPTION_BASE_CLASS,
                          DROPDOWN_OPTION_INTERACTIVE_CLASS,
                          isSelected && DROPDOWN_OPTION_SELECTED_CLASS,
                          activeIndex === index && 'bg-slate-50 text-[#1010a3]'
                        )}
                      >
                        <span className={cn('block', wrapText ? 'whitespace-normal break-words text-left' : 'truncate')}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              </div>
            </>,
            portalContainer,
          )}
      </div>
    </div>
  );
}
