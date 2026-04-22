'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Checkbox } from './checkbox';

export interface MultiSelectChipsOption {
  id: string;
  label: string;
}

interface MultiSelectChipsDropdownProps {
  label?: string;
  options: MultiSelectChipsOption[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyOptionsHint?: string;
  noResultsHint?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  /** Max height for the chip area in the trigger (many selections) */
  maxChipsHeightClassName?: string;
  /** Hide selected chips in closed trigger and show summary instead */
  showSelectedChipsOnlyWhenOpen?: boolean;
  /** Never show selected option labels in the trigger area */
  hideSelectedLabelsInTrigger?: boolean;
}

export function MultiSelectChipsDropdown({
  label,
  options,
  selectedIds,
  onSelectionChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyOptionsHint = 'No options',
  noResultsHint = 'No matches',
  isLoading = false,
  disabled = false,
  className,
  maxChipsHeightClassName = 'max-h-24',
  showSelectedChipsOnlyWhenOpen = false,
  hideSelectedLabelsInTrigger = false,
}: MultiSelectChipsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const optionById = useMemo(() => {
    const m = new Map<string, MultiSelectChipsOption>();
    options.forEach((o) => m.set(o.id, o));
    return m;
  }, [options]);

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

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const handleToggle = useCallback(
    (optionId: string) => {
      const next = new Set(selectedIds);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange],
  );

  const removeChip = useCallback(
    (optionId: string) => {
      const next = new Set(selectedIds);
      next.delete(optionId);
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange],
  );

  const handleRemoveChipClick = useCallback(
    (e: React.SyntheticEvent, optionId: string) => {
      e.stopPropagation();
      removeChip(optionId);
    },
    [removeChip],
  );

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredOptions.forEach((o) => next.add(o.id));
    onSelectionChange(next);
  };

  const handleClearSelection = () => {
    onSelectionChange(new Set());
  };

  const selectedChips = useMemo(() => {
    return Array.from(selectedIds)
      .map((id) => optionById.get(id))
      .filter((o): o is MultiSelectChipsOption => Boolean(o))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedIds, optionById]);

  const shouldShowChipsInTrigger =
    !hideSelectedLabelsInTrigger &&
    (!showSelectedChipsOnlyWhenOpen || isOpen);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
      )}
      <div
        role="button"
        tabIndex={isLoading || disabled ? -1 : 0}
        aria-disabled={isLoading || disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (disabled || isLoading) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          'w-full min-h-11 px-2 py-1.5 text-left bg-white border border-slate-200 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          (isLoading || disabled) && 'opacity-50 cursor-not-allowed pointer-events-none',
          !(isLoading || disabled) && 'hover:border-slate-300 cursor-pointer transition-colors',
        )}
      >
        <div className="flex items-start gap-2">
          <div
            className={cn(
              'flex flex-wrap flex-1 gap-1.5 items-center content-start overflow-y-auto',
              maxChipsHeightClassName,
            )}
          >
            {isLoading ? (
              <span className="text-sm text-slate-400 px-1 py-0.5">Loading…</span>
            ) : selectedChips.length === 0 ? (
              <span className="text-sm text-slate-400 px-1 py-1">{placeholder}</span>
            ) : !shouldShowChipsInTrigger ? (
              <span className="text-sm text-slate-500 px-1 py-1">
                {selectedChips.length} selected
              </span>
            ) : (
              selectedChips.map((opt) => (
                <span
                  key={opt.id}
                  className="inline-flex items-center gap-0.5 max-w-full pl-2 pr-1 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200/80"
                >
                  <span className="truncate max-w-[200px]">{opt.label}</span>
                  <span
                    tabIndex={0}
                    onClick={(e) => handleRemoveChipClick(e, opt.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        removeChip(opt.id);
                      }
                    }}
                    className="p-0.5 rounded-sm hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 shrink-0 inline-flex cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={`Remove ${opt.label}`}
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </span>
                </span>
              ))
            )}
          </div>
          <svg
            className={cn(
              'w-4 h-4 text-slate-500 transition-transform flex-shrink-0 mt-1.5',
              isOpen && 'rotate-180',
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-hidden flex flex-col">
          {options.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">{emptyOptionsHint}</div>
          ) : (
            <>
              <div className="p-2 border-b border-slate-200">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAllFiltered();
                  }}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  disabled={filteredOptions.length === 0}
                >
                  Select all (visible)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearSelection();
                  }}
                  className="text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
                  disabled={selectedIds.size === 0}
                >
                  Clear selection
                </button>
              </div>
              <div className="overflow-y-auto max-h-52">
                {filteredOptions.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500">{noResultsHint}</div>
                ) : (
                  <div className="py-1">
                    {filteredOptions.map((option) => {
                      const isSelected = selectedIds.has(option.id);
                      return (
                        <label
                          key={option.id}
                          className={cn(
                            'flex items-center px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors',
                            isSelected && 'bg-primary/10',
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggle(option.id)}
                          />
                          <span className="ml-3 text-sm text-slate-700 truncate">{option.label}</span>
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
  );
}
