'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Checkbox } from './checkbox';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';
import {
  DROPDOWN_CHEVRON_CLASS,
  DROPDOWN_LABEL_CLASS,
  DROPDOWN_MENU_SURFACE_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
  DROPDOWN_PLACEHOLDER_TEXT_CLASS,
  DROPDOWN_TRIGGER_BASE_CLASS,
  DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
  DROPDOWN_VALUE_TEXT_CLASS,
} from './dropdown-theme';

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
  /** When closed, show placeholder / single label / count instead of chips */
  closedTriggerMode?: 'chips' | 'summary';
  /** When every option is selected, show this label in summary mode (e.g. "All teachers"). */
  allSelectedLabel?: string;
  /** In summary mode, always show count for partial selection (never a single name). */
  summaryPartialUsesCount?: boolean;
  /** Hide the search field in the dropdown menu. */
  hideSearch?: boolean;
  triggerClassName?: string;
  selectedCountLabel?: (count: number) => string;
  onClearSelection?: () => void;
  /** Grow trigger and menu width to fit full option labels (no truncation). */
  fitContentWidth?: boolean;
  /** Keep trigger width fixed but expand the open menu to fit option labels. */
  menuFitContentWidth?: boolean;
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
  closedTriggerMode = 'chips',
  allSelectedLabel,
  summaryPartialUsesCount = false,
  hideSearch = false,
  triggerClassName,
  selectedCountLabel = (count) => `${count} selected`,
  onClearSelection,
  fitContentWidth = false,
  menuFitContentWidth = false,
}: MultiSelectChipsDropdownProps) {
  const t = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const optionById = useMemo(() => {
    const m = new Map<string, MultiSelectChipsOption>();
    options.forEach((o) => m.set(o.id, o));
    return m;
  }, [options]);

  useOutsidePress(
    dropdownRef,
    () => {
      setIsOpen(false);
      setSearchQuery('');
    },
    { enabled: isOpen },
  );

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const handleSetSelected = useCallback(
    (optionId: string, checked: boolean) => {
      const next = new Set(selectedIds);
      if (checked) {
        next.add(optionId);
      } else {
        next.delete(optionId);
      }
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
    if (onClearSelection) {
      onClearSelection();
      return;
    }
    onSelectionChange(new Set());
  };

  const isAllOptionsSelected = options.length > 0 && selectedIds.size >= options.length;

  const selectedChips = useMemo(() => {
    return Array.from(selectedIds)
      .map((id) => optionById.get(id))
      .filter((o): o is MultiSelectChipsOption => Boolean(o))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedIds, optionById]);

  const shouldShowChipsInTrigger =
    closedTriggerMode === 'chips' &&
    !hideSelectedLabelsInTrigger &&
    (!showSelectedChipsOnlyWhenOpen || isOpen);

  const closedSummaryText = useMemo(() => {
    if (allSelectedLabel && isAllOptionsSelected) {
      return allSelectedLabel;
    }
    if (selectedChips.length === 0) {
      return allSelectedLabel ?? placeholder;
    }
    if (allSelectedLabel || summaryPartialUsesCount) {
      return selectedCountLabel(selectedChips.length);
    }
    if (selectedChips.length === 1) {
      return selectedChips[0]!.label;
    }
    return selectedCountLabel(selectedChips.length);
  }, [
    allSelectedLabel,
    isAllOptionsSelected,
    placeholder,
    selectedChips,
    selectedCountLabel,
    summaryPartialUsesCount,
  ]);

  const isSummaryTrigger = closedTriggerMode === 'summary';
  const hasSummarySelection =
    selectedChips.length > 0 && !(allSelectedLabel && isAllOptionsSelected);
  const expandMenuLabels = fitContentWidth || menuFitContentWidth;

  return (
    <div className={cn('relative', fitContentWidth && 'w-full sm:w-auto', className)} ref={dropdownRef}>
      {label && (
        <label className={DROPDOWN_LABEL_CLASS}>{label}</label>
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
          isSummaryTrigger
            ? 'flex w-full items-center text-left sm:w-auto'
            : 'w-full min-h-11 py-1.5 text-left px-2',
          DROPDOWN_TRIGGER_BASE_CLASS,
          !isSummaryTrigger && fitContentWidth && 'sm:w-auto',
          DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
          isOpen && 'border-[#1010a3]/35 shadow-[0_8px_20px_rgba(16,16,163,0.12)]',
          (isLoading || disabled) && 'opacity-50 cursor-not-allowed pointer-events-none',
          !(isLoading || disabled) && 'cursor-pointer transition-colors',
          triggerClassName,
        )}
      >
        {isSummaryTrigger ? (
          <div className="flex min-w-0 w-full items-center justify-between gap-2">
            <span
              className={cn(
                'text-sm',
                fitContentWidth ? 'whitespace-nowrap' : 'truncate',
                hasSummarySelection ? DROPDOWN_VALUE_TEXT_CLASS : DROPDOWN_PLACEHOLDER_TEXT_CLASS,
              )}
            >
              {isLoading ? t('loading') : closedSummaryText}
            </span>
            <svg
              className={cn(DROPDOWN_CHEVRON_CLASS, isOpen && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        ) : (
        <div className={cn('flex gap-2 items-start')}>
          <div
            className={cn(
              'flex items-center content-start overflow-y-auto',
              fitContentWidth ? 'min-h-0 shrink-0' : 'min-w-0 flex-1 flex-wrap gap-1.5',
              !fitContentWidth && closedTriggerMode === 'summary' ? 'min-h-0' : maxChipsHeightClassName,
              fitContentWidth && closedTriggerMode !== 'summary' && maxChipsHeightClassName,
            )}
          >
            {isLoading ? (
              <span className={cn('px-1 py-0.5 text-sm', DROPDOWN_PLACEHOLDER_TEXT_CLASS)}>{t('loading')}</span>
            ) : selectedChips.length === 0 ? (
              <span className={cn('px-1 py-1 text-sm', DROPDOWN_PLACEHOLDER_TEXT_CLASS)}>{placeholder}</span>
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
                    className="inline-flex shrink-0 cursor-pointer rounded-sm p-0.5 text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1010a3]/25"
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
              DROPDOWN_CHEVRON_CLASS,
              'mt-1.5',
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
        )}
      </div>

      {isOpen && (
        <div
          className={cn(
            DROPDOWN_MENU_SURFACE_CLASS,
            'absolute mt-1 flex max-h-72 flex-col overflow-hidden',
            expandMenuLabels
              ? 'left-1/2 right-auto w-max min-w-full max-w-[calc(100vw-2rem)] -translate-x-1/2'
              : 'w-full',
          )}
        >
          {options.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">{emptyOptionsHint}</div>
          ) : (
            <>
              {!hideSearch ? (
                <div className="p-2 border-b border-slate-200">
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-[#1010a3]/45 focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : null}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAllFiltered();
                  }}
                  className="text-xs font-medium text-[#1010a3] transition-colors hover:text-[#0d0d85]"
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
                  <div className="space-y-1 px-1 py-1">
                    {filteredOptions.map((option) => {
                      const isSelected = selectedIds.has(option.id);
                      return (
                        <label
                          key={option.id}
                          className={cn(
                            'flex cursor-pointer items-center rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50',
                            isSelected && DROPDOWN_OPTION_SELECTED_CLASS,
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSetSelected(option.id, checked)}
                          />
                          <span
                            className={cn(
                              'ml-3 text-sm text-slate-700',
                              expandMenuLabels ? 'whitespace-nowrap' : 'truncate',
                            )}
                          >
                            {option.label}
                          </span>
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
