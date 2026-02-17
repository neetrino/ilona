'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';
import { getErrorMessage } from '@/shared/lib/api';

interface InlineSelectProps {
  value: string | null;
  options: Array<{ id: string; label: string }>;
  onChange: (value: string | null) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function InlineSelect({
  value,
  options,
  onChange,
  placeholder = 'Not assigned',
  disabled = false,
  className,
}: InlineSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; placement: 'bottom' | 'top' } | null>(null);

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

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
      const estimatedDropdownHeight = (options.length + 1) * estimatedItemHeight + 8; // +1 for placeholder, +8 for padding
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
    
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    // Use a small delay to avoid immediate close on open
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = async (newValue: string | null) => {
    if (newValue === localValue) {
      setIsOpen(false);
      return;
    }

    const previousValue = localValue;
    setLocalValue(newValue);
    setIsLoading(true);
    setError(null);
    setIsOpen(false);

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
        className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
        }}
      >
        <div className="py-1">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
              !localValue && 'bg-primary/10 font-medium'
            )}
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                localValue === option.id && 'bg-primary/10 font-medium'
              )}
            >
              {option.label}
            </button>
          ))}
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
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={cn(
          'w-full pl-0 pr-3 py-1.5 text-left text-sm rounded-md',
          'border border-transparent hover:border-slate-300',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
          !localValue && 'text-slate-400',
          error && 'border-red-300 bg-red-50',
          isLoading && 'opacity-50 cursor-wait'
        )}
        title={error || undefined}
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
                'w-4 h-4 text-slate-400 flex-shrink-0 transition-transform',
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

