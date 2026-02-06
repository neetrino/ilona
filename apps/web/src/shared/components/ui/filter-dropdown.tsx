'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  placeholder?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function FilterDropdown({
  label,
  options,
  selectedIds,
  onSelectionChange,
  placeholder = 'All',
  isLoading = false,
  error = null,
  className,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (optionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    onSelectionChange(newSelected);
  };

  const getDisplayText = () => {
    if (selectedIds.size === 0) {
      return placeholder;
    }
    if (selectedIds.size === 1) {
      const selected = options.find((opt) => selectedIds.has(opt.id));
      return selected?.label || placeholder;
    }
    return `${selectedIds.size} selected`;
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <label className="block text-sm font-medium text-slate-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={cn(
            'w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:border-slate-300 transition-colors'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn(
              'text-sm',
              selectedIds.size === 0 ? 'text-slate-400' : 'text-slate-800'
            )}>
              {isLoading ? 'Loading...' : getDisplayText()}
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
                  const isSelected = selectedIds.has(option.id);
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        'flex items-center px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors',
                        isSelected && 'bg-blue-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(option.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="ml-3 text-sm text-slate-700">{option.label}</span>
                    </label>
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




