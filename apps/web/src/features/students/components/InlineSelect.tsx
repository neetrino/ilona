'use client';

import { useState, useRef, useEffect } from 'react';
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

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
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

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
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

      {isOpen && !disabled && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
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
        </div>
      )}

      {error && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-600 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}

