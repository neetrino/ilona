'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';
import { getErrorMessage } from '@/shared/lib/api';
import {
  DROPDOWN_CHEVRON_CLASS,
  DROPDOWN_MENU_PORTAL_SURFACE_CLASS,
  DROPDOWN_OPTION_BASE_CLASS,
  DROPDOWN_OPTION_INTERACTIVE_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
  DROPDOWN_PLACEHOLDER_TEXT_CLASS,
  DROPDOWN_TRIGGER_BASE_CLASS,
  DROPDOWN_TRIGGER_DISABLED_CLASS,
  DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
} from '@/shared/components/ui/dropdown-theme';

export interface InlineSelectOption {
  id: string;
  label: string;
  /** Extra text used for client-side search (not shown in the menu). */
  searchText?: string;
}

interface InlineSelectProps {
  value: string | null;
  options: InlineSelectOption[];
  onChange: (value: string | null) => Promise<void>;
  placeholder?: string;
  /** First row in the open menu (clear value). Defaults to `placeholder`. */
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptySearchMessage?: string;
}

function matchesSearchQuery(option: InlineSelectOption, query: string): boolean {
  const haystack = (option.searchText ?? option.label).toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function InlineSelect({
  value,
  options,
  onChange,
  placeholder = 'Not assigned',
  clearLabel,
  disabled = false,
  className,
  searchable = false,
  searchPlaceholder = 'Search...',
  emptySearchMessage = 'No results found',
}: InlineSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState(value);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; placement: 'bottom' | 'top' } | null>(null);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    return options.filter((option) => matchesSearchQuery(option, searchQuery.trim()));
  }, [options, searchable, searchQuery]);

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (!isOpen || !searchable) return;
    const timeoutId = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [isOpen, searchable]);

  // Calculate dropdown position and handle click outside
  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      setPosition(null);
      return;
    }

    function updatePosition() {
      if (!buttonRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      // Estimate dropdown height (placeholder + options, each ~36px)
      const estimatedItemHeight = 36;
      const searchInputHeight = searchable ? 44 : 0;
      const visibleOptionCount = searchable ? filteredOptions.length : options.length;
      const estimatedDropdownHeight =
        (visibleOptionCount + 1) * estimatedItemHeight + searchInputHeight + 8;
      const maxDropdownHeight = 240; // max-h-60 = 240px
      const dropdownHeight = Math.min(estimatedDropdownHeight, maxDropdownHeight);
      
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      // Determine placement: prefer bottom, but flip to top if not enough space
      const placement: 'bottom' | 'top' = spaceBelow >= Math.min(dropdownHeight, 150) || spaceBelow >= spaceAbove ? 'bottom' : 'top';
      
      let top: number;
      if (placement === 'bottom') {
        // Position below the button with a small gap
        top = buttonRect.bottom + scrollY + 4;
      } else {
        // Position above the button - calculate from button top minus dropdown height
        top = buttonRect.top + scrollY - dropdownHeight - 4;
        // Ensure it doesn't go above viewport
        if (top < scrollY + 4) {
          top = scrollY + 4;
        }
      }
      
      // Calculate left position, ensuring it stays within viewport
      let left = buttonRect.left + scrollX;
      // Ensure dropdown doesn't overflow right edge
      if (left + buttonRect.width > viewportWidth + scrollX - 4) {
        left = viewportWidth + scrollX - buttonRect.width - 4;
      }
      // Ensure dropdown doesn't overflow left edge
      if (left < scrollX + 4) {
        left = scrollX + 4;
      }
      
      setPosition({
        top,
        left,
        width: buttonRect.width,
        placement,
      });
    }

    updatePosition();
    
    // Update position on scroll or resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    function handleClickOutside(event: Event) {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    }

    const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window;

    // Use a small delay to avoid immediate close on open
    const timeoutId = setTimeout(() => {
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
      if (supportsPointer) {
        document.removeEventListener('pointerdown', handleClickOutside);
      } else {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      }
    };
  }, [isOpen, options.length, searchable, filteredOptions.length]);

  const emptyActionLabel = clearLabel ?? placeholder;

  const handleSelect = async (newValue: string | null) => {
    if (newValue === localValue) {
      closeDropdown();
      return;
    }

    const previousValue = localValue;
    setLocalValue(newValue);
    setIsLoading(true);
    setError(null);
    closeDropdown();

    try {
      await onChange(newValue);
    } catch (err: unknown) {
      // Revert on error
      setLocalValue(previousValue);
      setError(getErrorMessage(err, 'Failed to update'));
      // Show error for 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedOption = options.find(opt => opt.id === localValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const dropdownMenu = isOpen && !disabled && !isLoading && position && typeof window !== 'undefined' ? (
    createPortal(
      <div
        ref={menuRef}
        className={cn(DROPDOWN_MENU_PORTAL_SURFACE_CLASS, 'max-h-60')}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
        }}
      >
        <div className="flex max-h-60 flex-col overflow-hidden">
          {searchable && (
            <div className="border-b border-[rgba(14,14,16,0.08)] p-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                placeholder={searchPlaceholder}
                onChange={(event) => setSearchQuery(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === 'Escape') {
                    closeDropdown();
                  }
                }}
                className="w-full rounded border border-[rgba(14,14,16,0.12)] px-2 py-1.5 text-sm focus:border-[#1010a3] focus:outline-none focus:ring-1 focus:ring-[#1010a3]"
              />
            </div>
          )}
          <div className="space-y-1 overflow-y-auto px-1 py-1">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                DROPDOWN_OPTION_BASE_CLASS,
                DROPDOWN_OPTION_INTERACTIVE_CLASS,
                !localValue && DROPDOWN_OPTION_SELECTED_CLASS
              )}
            >
              {emptyActionLabel}
            </button>
            {searchable && searchQuery.trim() && filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[#8b8b90]">{emptySearchMessage}</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={cn(
                    DROPDOWN_OPTION_BASE_CLASS,
                    DROPDOWN_OPTION_INTERACTIVE_CLASS,
                    localValue === option.id && DROPDOWN_OPTION_SELECTED_CLASS
                  )}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (disabled || isLoading) return;
          if (isOpen) {
            closeDropdown();
            return;
          }
          setIsOpen(true);
        }}
        disabled={disabled || isLoading}
        className={cn(
          'w-full min-h-11 py-2 text-left text-sm',
          DROPDOWN_TRIGGER_BASE_CLASS,
          DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
          DROPDOWN_TRIGGER_DISABLED_CLASS,
          !localValue && DROPDOWN_PLACEHOLDER_TEXT_CLASS,
          error && 'border-red-300 bg-red-50',
          isLoading && 'opacity-50 cursor-wait'
        )}
        title={error || (displayText !== placeholder ? displayText : undefined)}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate">
            {isLoading ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </span>
            ) : (
              displayText
            )}
          </span>
          {!isLoading && (
            <svg
              className={cn(
                DROPDOWN_CHEVRON_CLASS,
                isOpen && 'transform rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {dropdownMenu}

      {error && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-600 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}

