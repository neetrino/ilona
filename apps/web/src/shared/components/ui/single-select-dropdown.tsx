'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

export interface SingleSelectOption {
  id: string;
  label: string;
}

interface SingleSelectDropdownProps {
  label?: string;
  options: SingleSelectOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  disabled?: boolean;
}

export function SingleSelectDropdown({
  label,
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  isLoading = false,
  error = null,
  className,
  disabled = false,
}: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.id === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionId: string) => {
    onValueChange(optionId === value ? null : optionId);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-500 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={isLoading || disabled}
          className={cn(
            'w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:border-slate-300 transition-colors',
            error && 'border-red-500'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn(
              'text-sm',
              !selectedOption ? 'text-slate-400' : 'text-slate-800'
            )}>
              {isLoading ? 'Loading...' : displayText}
            </span>
            <svg
              className={cn(
                'w-4 h-4 text-slate-500 transition-transform',
                isOpen && 'transform rotate-180'
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
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {error ? (
              <div className="p-3 text-sm text-red-600">{error}</div>
            ) : options.length === 0 ? (
              <div className="p-3 text-sm text-slate-500">No options available</div>
            ) : (
              <div className="py-1">
                {options.map((option) => {
                  const isSelected = value === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors',
                        isSelected && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      {option.label}
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
