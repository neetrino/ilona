'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';
import {
  preventStackedSheetDismiss,
  stackedSheetDialogHandlers,
} from '@/shared/lib/sheet-stack';
import { DATE_PICKER_POPOVER_ATTR } from './date-picker-input';
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

const MOBILE_BODY_PORTAL_MAX_WIDTH = 1366;

function shouldPortalMenuToBody(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BODY_PORTAL_MAX_WIDTH;
}

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
  preventStackedSheetDismiss(event);
}

export { preventStackedSheetDismiss, stackedSheetDialogHandlers };

export const portaledDropdownDialogHandlers = stackedSheetDialogHandlers;

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
  searchable?: boolean;
  searchPlaceholder?: string;
  noSearchResultsMessage?: string;
  menuMinWidth?: number;
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
  searchable = false,
  searchPlaceholder,
  noSearchResultsMessage,
  menuMinWidth,
}: SingleSelectDropdownProps) {
  const t = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generatedId = React.useId();
  const triggerId = id ?? `single-select-${generatedId}`;
  const labelId = label ? `${triggerId}-label` : undefined;
  const listboxId = `${triggerId}-listbox`;

  const hasSelection = Boolean(value);
  const selectedOption = options.find((opt) => (value ?? '') === opt.id);
  const displayText = selectedOption ? selectedOption.label : placeholder;
  const resolvedSearchPlaceholder = searchPlaceholder ?? `${t('search')}...`;
  const resolvedNoSearchResultsMessage = noSearchResultsMessage ?? t('globalSearchEmpty');

  const filteredOptions = React.useMemo(() => {
    const listOptions = searchable
      ? options.filter((option) => option.id !== '')
      : options;

    if (!searchable || !searchQuery.trim()) {
      return listOptions;
    }

    const query = searchQuery.trim().toLowerCase();
    return listOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, searchable, searchQuery]);

  const closeMenu = React.useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const updateMenuPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const root = dropdownRef.current;
    if (!trigger) return;

    const portalTarget = shouldPortalMenuToBody()
      ? document.body
      : resolvePortalContainer(root);
    setPortalContainer(portalTarget);
    const useDialogPortal = !shouldPortalMenuToBody() && portalTarget !== document.body;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = menuMinWidth ? Math.max(rect.width, menuMinWidth) : rect.width;
    let menuLeft = menuMinWidth && menuWidth > rect.width ? rect.right - menuWidth : rect.left;
    const viewportPadding = 12;
    if (menuMinWidth) {
      menuLeft = Math.max(
        viewportPadding,
        Math.min(menuLeft, window.innerWidth - menuWidth - viewportPadding),
      );
    }
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const searchInputHeight = searchable ? 52 : 0;
    const shouldOpenUpward = useDialogPortal
      ? spaceBelow < 220 + searchInputHeight || (spaceAbove > spaceBelow && spaceBelow < 280)
      : spaceBelow < 220 + searchInputHeight && spaceAbove > spaceBelow;
    const availableSpace = Math.max(120, shouldOpenUpward ? spaceAbove : spaceBelow);
    const maxHeight = Math.min(320 + searchInputHeight, Math.floor(availableSpace));

    setOpenUpward(shouldOpenUpward);

    if (useDialogPortal) {
      const dialogRect = portalTarget.getBoundingClientRect();
      setMenuPosition({
        positionMode: 'absolute',
        left: rect.left - dialogRect.left + (menuLeft - rect.left),
        width: menuWidth,
        maxHeight,
        ...(shouldOpenUpward
          ? { bottom: dialogRect.bottom - rect.top + 6 }
          : { top: rect.bottom - dialogRect.top + 6 }),
      });
      return;
    }

    setMenuPosition({
      positionMode: 'fixed',
      left: menuLeft,
      width: menuWidth,
      maxHeight,
      ...(shouldOpenUpward
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    });
  }, [searchable, menuMinWidth]);

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      setPortalContainer(null);
      return;
    }

    updateMenuPosition();

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDownOutside, true);
    }, 0);

    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('pointerdown', handlePointerDownOutside, true);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition, closeMenu]);

  useEffect(() => {
    if (!isOpen || !searchable) return;
    const timeoutId = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(timeoutId);
  }, [isOpen, searchable]);

  const handleSelect = (optionId: string) => {
    const normalizedOption = optionId === '' ? null : optionId;
    const nextValue =
      allowDeselect && normalizedOption === value ? null : normalizedOption;
    onValueChange(nextValue);
    closeMenu();
    triggerRef.current?.focus();
  };

  const handleTriggerPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    setIsOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        const selectedIndex = Math.max(
          0,
          filteredOptions.findIndex((option) => option.id === value),
        );
        setActiveIndex(selectedIndex);
      }
      return nextOpen;
    });
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        const selectedIndex = Math.max(0, filteredOptions.findIndex((option) => option.id === value));
        setActiveIndex(selectedIndex);
        setIsOpen(true);
        return;
      }

      setActiveIndex((prev) => {
        if (filteredOptions.length === 0) return -1;
        if (prev < 0) return 0;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        return (prev + step + filteredOptions.length) % filteredOptions.length;
      });
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen((prev) => !prev);
      if (!isOpen) {
        const selectedIndex = Math.max(0, filteredOptions.findIndex((option) => option.id === value));
        setActiveIndex(selectedIndex);
      }
    }

    if (event.key === 'Escape') {
      closeMenu();
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
      return;
    }

    if (event.key === 'Tab') {
      closeMenu();
      return;
    }

    if (filteredOptions.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((prev) => {
        if (prev < 0) return 0;
        return (prev + step + filteredOptions.length) % filteredOptions.length;
      });
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(filteredOptions.length - 1);
    }

    if ((event.key === 'Enter' || event.key === ' ') && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(filteredOptions[activeIndex].id);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const selectedIndex = filteredOptions.findIndex((option) => option.id === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : filteredOptions.length > 0 ? 0 : -1);
  }, [isOpen, filteredOptions, value]);

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
          onPointerDown={handleTriggerPointerDown}
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
                className={cn(backdropPositionClass, 'inset-0 z-[9998] pointer-events-none')}
                aria-hidden="true"
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
                  'pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-[rgba(14,14,16,0.08)] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/5',
                  'animate-in fade-in-0 zoom-in-95 duration-150',
                  openUpward ? 'origin-bottom' : 'origin-top',
                )}
              >
              {error ? (
                <div className="p-3 text-sm text-red-600">{error}</div>
              ) : options.length === 0 ? (
                <div className="p-3 text-sm text-[#8b8b90]">{t('noOptionsAvailable')}</div>
              ) : (
                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1">
                  {searchable && (
                    <div
                      className={cn(
                        DROPDOWN_OPTION_BASE_CLASS,
                        'cursor-text p-0 ring-2 ring-inset ring-[#1010a3]/10',
                      )}
                    >
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        placeholder={resolvedSearchPlaceholder}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === 'Escape') {
                            closeMenu();
                            triggerRef.current?.focus();
                          }
                          if (event.key === 'ArrowDown' && filteredOptions.length > 0) {
                            event.preventDefault();
                            setActiveIndex(0);
                            optionRefs.current[0]?.focus();
                          }
                        }}
                        className="h-full w-full rounded-lg border-0 bg-transparent px-3 py-2.5 text-sm text-[#3b3b40] placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  )}
                  {searchable && searchQuery.trim() && filteredOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-[#8b8b90]">{resolvedNoSearchResultsMessage}</div>
                  ) : (
                    filteredOptions.map((option, index) => {
                      const isSelected = (value ?? '') === option.id;
                      return (
                        <button
                          id={`${listboxId}-option-${option.id || index}`}
                          key={option.id || `empty-${index}`}
                          ref={(node) => {
                            optionRefs.current[index] = node;
                          }}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          title={option.label}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleSelect(option.id);
                          }}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={cn(
                            DROPDOWN_OPTION_BASE_CLASS,
                            DROPDOWN_OPTION_INTERACTIVE_CLASS,
                            isSelected && DROPDOWN_OPTION_SELECTED_CLASS,
                            activeIndex === index && 'bg-slate-50 text-[#1010a3]',
                          )}
                        >
                          <span
                            className={cn(
                              'block',
                              wrapText ? 'whitespace-normal break-words text-left' : 'truncate',
                            )}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })
                  )}
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
