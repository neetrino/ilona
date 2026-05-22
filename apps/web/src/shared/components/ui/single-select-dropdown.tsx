'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  DROPDOWN_CHEVRON_CLASS,
  DROPDOWN_LABEL_CLASS,
  DROPDOWN_MENU_SURFACE_CLASS,
  DROPDOWN_OPTION_BASE_CLASS,
  DROPDOWN_OPTION_INTERACTIVE_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
  DROPDOWN_PLACEHOLDER_TEXT_CLASS,
  DROPDOWN_TRIGGER_BASE_CLASS,
  DROPDOWN_TRIGGER_DISABLED_CLASS,
  DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
  DROPDOWN_TRIGGER_OPEN_CLASS,
  DROPDOWN_VALUE_TEXT_CLASS,
} from './dropdown-theme';

export interface SingleSelectOption {
  id: string;
  label: string;
}

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
  disabled?: boolean;
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
  disabled = false,
}: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [menuMaxHeight, setMenuMaxHeight] = useState(288);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generatedId = React.useId();
  const triggerId = id ?? `single-select-${generatedId}`;
  const labelId = label ? `${triggerId}-label` : undefined;
  const listboxId = `${triggerId}-listbox`;

  const selectedOption = options.find((opt) => opt.id === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const updateMenuPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const shouldOpenUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
    const availableSpace = Math.max(120, shouldOpenUpward ? spaceAbove : spaceBelow);

    setOpenUpward(shouldOpenUpward);
    setMenuMaxHeight(Math.min(320, Math.floor(availableSpace)));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      updateMenuPosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updateMenuPosition);
      window.addEventListener('scroll', updateMenuPosition, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <div className={cn('relative min-w-0', className)} ref={dropdownRef}>
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
            isOpen && DROPDOWN_TRIGGER_OPEN_CLASS,
            error && 'border-red-500'
          )}
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className={cn(
              'truncate text-sm',
              !selectedOption ? DROPDOWN_PLACEHOLDER_TEXT_CLASS : DROPDOWN_VALUE_TEXT_CLASS
            )}>
              {isLoading ? 'Loading...' : displayText}
            </span>
            <svg
              className={cn(
                DROPDOWN_CHEVRON_CLASS,
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

        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={-1}
            onKeyDown={handleMenuKeyDown}
            style={{ maxHeight: `${menuMaxHeight}px` }}
            className={cn(
              DROPDOWN_MENU_SURFACE_CLASS,
              'animate-in fade-in-0 zoom-in-95 duration-150',
              openUpward ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
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
                      onClick={() => handleSelect(option.id)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        DROPDOWN_OPTION_BASE_CLASS,
                        DROPDOWN_OPTION_INTERACTIVE_CLASS,
                        isSelected && DROPDOWN_OPTION_SELECTED_CLASS,
                        activeIndex === index && 'bg-slate-50 text-[#1010a3]'
                      )}
                    >
                      <span className="block truncate">{option.label}</span>
                    </button>
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
