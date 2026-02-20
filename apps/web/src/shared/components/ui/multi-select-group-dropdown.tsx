'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Checkbox } from './checkbox';

export interface MultiSelectOption {
  id: string;
  label: string;
}

interface MultiSelectGroupDropdownProps {
  label?: string;
  options: MultiSelectOption[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  placeholder?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export function MultiSelectGroupDropdown({
  label,
  options,
  selectedIds,
  onSelectionChange,
  placeholder,
  isLoading = false,
  error = null,
  className,
  disabled = false,
  searchable = true,
}: MultiSelectGroupDropdownProps) {
  const t = useTranslations('attendance');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const handleToggle = (optionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredOptions.map((opt) => opt.id));
    onSelectionChange(allIds);
  };

  const handleClearAll = () => {
    onSelectionChange(new Set());
  };

  const getDisplayText = () => {
    if (selectedIds.size === 0) {
      return placeholder || t('selectGroup');
    }
    if (selectedIds.size === 1) {
      const selected = options.find((opt) => selectedIds.has(opt.id));
      return selected?.label || placeholder || t('selectGroup');
    }
    return t('groupsSelected', { count: selectedIds.size });
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={isLoading || disabled}
          className={cn(
            'w-full px-4 py-2 text-left bg-white border border-slate-300 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:border-slate-400 transition-colors',
            error && 'border-red-500'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn(
              'text-sm truncate',
              selectedIds.size === 0 ? 'text-slate-400' : 'text-slate-800'
            )}>
              {isLoading ? 'Loading...' : getDisplayText()}
            </span>
            <svg
              className={cn(
                'w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ml-2',
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
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
            {error ? (
              <div className="p-3 text-sm text-red-600">{error}</div>
            ) : options.length === 0 ? (
              <div className="p-3 text-sm text-slate-500">{t('noGroupsAvailable')}</div>
            ) : (
              <>
                {/* Search input */}
                {searchable && (
                  <div className="p-2 border-b border-slate-200">
                    <input
                      type="text"
                      placeholder={t('searchGroups')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {/* Select All / Clear All buttons */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAll();
                    }}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    disabled={filteredOptions.length === 0}
                  >
                    {t('selectAll')}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearAll();
                    }}
                    className="text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    disabled={selectedIds.size === 0}
                  >
                    {t('clearAll')}
                  </button>
                </div>

                {/* Options list */}
                <div className="overflow-y-auto max-h-48">
                  {filteredOptions.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">{t('noGroupsFound')}</div>
                  ) : (
                    <div className="py-1">
                      {filteredOptions.map((option) => {
                        const isSelected = selectedIds.has(option.id);
                        return (
                          <label
                            key={option.id}
                            className={cn(
                              'flex items-center px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors',
                              isSelected && 'bg-primary/10'
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggle(option.id)}
                            />
                            <span className="ml-3 text-sm text-slate-700">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

