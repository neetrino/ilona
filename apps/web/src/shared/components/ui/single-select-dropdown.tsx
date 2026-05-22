'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

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
        <label className="mb-1.5 block text-sm font-medium text-[#3b3b40]">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={isLoading || disabled}
          className={cn(
            'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-left',
            'focus:border-[#1010a3]/45 focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors hover:border-[#1010a3]/30',
            isOpen && 'border-[#1010a3]/35 shadow-lg',
            error && 'border-red-500'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn(
              'truncate text-sm',
              !selectedOption ? 'text-slate-400' : 'text-[#2f2f35]'
            )}>
              {isLoading ? 'Loading...' : displayText}
            </span>
            <svg
              className={cn(
                'h-4 w-4 text-slate-500 transition-transform duration-150',
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
          <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
            {error ? (
              <div className="p-3 text-sm text-red-600">{error}</div>
            ) : options.length === 0 ? (
              <div className="p-3 text-sm text-[#8b8b90]">No options available</div>
            ) : (
              <div className="space-y-1">
                {options.map((option) => {
                  const isSelected = value === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      className={cn(
                        'w-full rounded-lg px-3 py-2 text-left text-sm text-[#3b3b40] transition-colors',
                        'hover:bg-slate-50 hover:text-[#1010a3]',
                        isSelected && 'bg-[#ecefff] font-medium text-[#1010a3]'
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
