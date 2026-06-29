'use client';

import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';
import {
  DROPDOWN_OPTION_BASE_CLASS,
  DROPDOWN_OPTION_INTERACTIVE_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
} from '../dropdown-theme';
import {
  SINGLE_SELECT_DROPDOWN_BACKDROP_ATTR,
  SINGLE_SELECT_DROPDOWN_MENU_ATTR,
} from './single-select-dropdown.constants';
import type { MenuPosition, SingleSelectOption } from './single-select-dropdown.types';

interface SingleSelectDropdownMenuProps {
  isOpen: boolean;
  openUpward: boolean;
  menuPosition: MenuPosition | null;
  portalContainer: HTMLElement | null;
  useDialogPortal: boolean;
  listboxId: string;
  labelId?: string;
  error: string | null;
  options: SingleSelectOption[];
  filteredOptions: SingleSelectOption[];
  searchable: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resolvedSearchPlaceholder: string;
  resolvedNoSearchResultsMessage: string;
  wrapText: boolean;
  value: string | null;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelect: (optionId: string) => void;
  onMenuKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  optionRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function SingleSelectDropdownMenu({
  isOpen,
  openUpward,
  menuPosition,
  portalContainer,
  useDialogPortal,
  listboxId,
  labelId,
  error,
  options,
  filteredOptions,
  searchable,
  searchQuery,
  onSearchChange,
  resolvedSearchPlaceholder,
  resolvedNoSearchResultsMessage,
  wrapText,
  value,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  onMenuKeyDown,
  onClose,
  menuRef,
  searchInputRef,
  optionRefs,
  triggerRef,
}: SingleSelectDropdownMenuProps) {
  const t = useTranslations('common');

  if (!isOpen || !menuPosition || !portalContainer || typeof document === 'undefined') {
    return null;
  }

  const backdropPositionClass = useDialogPortal ? 'absolute' : 'fixed';

  return createPortal(
    <>
      <div
        {...{ [SINGLE_SELECT_DROPDOWN_BACKDROP_ATTR]: '' }}
        className={cn(backdropPositionClass, 'pointer-events-none inset-0 z-[9998]')}
        aria-hidden="true"
      />
      <div
        ref={menuRef}
        id={listboxId}
        {...{ [SINGLE_SELECT_DROPDOWN_MENU_ATTR]: '' }}
        role="listbox"
        aria-labelledby={labelId}
        tabIndex={-1}
        onKeyDown={onMenuKeyDown}
        onPointerDown={(event) => event.stopPropagation()}
        style={{
          position: menuPosition.positionMode,
          zIndex: 9999,
          left: `${menuPosition.left}px`,
          width: `${menuPosition.width}px`,
          maxHeight: `${menuPosition.maxHeight}px`,
          ...(menuPosition.top !== undefined ? { top: `${menuPosition.top}px` } : {}),
          ...(menuPosition.bottom !== undefined ? { bottom: `${menuPosition.bottom}px` } : {}),
        }}
        className={cn(
          'pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-[rgba(14,14,16,0.08)] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/5',
          'animate-in fade-in-0 zoom-in-95 duration-150',
          openUpward ? 'origin-bottom' : 'origin-top',
        )}
      >
        {error ? (
          <div className="p-3 text-sm text-red-600">{error}</div>
        ) : options.length === 0 ? (
          <div className="p-3 text-sm text-[#8b8b90]">{t('noOptionsAvailable')}</div>
        ) : (
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1">
            {searchable && (
              <div
                className={cn(
                  DROPDOWN_OPTION_BASE_CLASS,
                  'cursor-text p-0 ring-2 ring-inset ring-[#1010a3]/10',
                )}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  placeholder={resolvedSearchPlaceholder}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                    if (event.key === 'Escape') {
                      onClose();
                      triggerRef.current?.focus();
                    }
                    if (event.key === 'ArrowDown' && filteredOptions.length > 0) {
                      event.preventDefault();
                      onActiveIndexChange(0);
                      optionRefs.current[0]?.focus();
                    }
                  }}
                  className="h-full w-full rounded-lg border-0 bg-transparent px-3 py-2.5 text-sm text-[#3b3b40] placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            )}
            {searchable && searchQuery.trim() && filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[#8b8b90]">{resolvedNoSearchResultsMessage}</div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = (value ?? '') === option.id;
                return (
                  <button
                    id={`${listboxId}-option-${option.id || index}`}
                    key={option.id || `empty-${index}`}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    title={option.label}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onSelect(option.id);
                    }}
                    onMouseEnter={() => onActiveIndexChange(index)}
                    className={cn(
                      DROPDOWN_OPTION_BASE_CLASS,
                      DROPDOWN_OPTION_INTERACTIVE_CLASS,
                      isSelected && DROPDOWN_OPTION_SELECTED_CLASS,
                      activeIndex === index && 'bg-slate-50 text-[#1010a3]',
                    )}
                  >
                    <span
                      className={cn(
                        'block',
                        wrapText ? 'whitespace-normal break-words text-left' : 'truncate',
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </>,
    portalContainer,
  );
}
