'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { getFixedDropdownPlacement, type FixedDropdownPlacement } from '@/shared/lib/dropdown-placement';
import {
  DROPDOWN_CHEVRON_CLASS,
  DROPDOWN_MENU_PORTAL_SURFACE_CLASS,
  DROPDOWN_OPTION_BASE_CLASS,
  DROPDOWN_OPTION_INTERACTIVE_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
} from '@/shared/components/ui/dropdown-theme';
import type { SalaryStatus } from '@/features/finance';

const STATUS_OPTIONS: SalaryStatus[] = ['PENDING', 'PAID'];
const MENU_MIN_WIDTH_PX = 176;
const MENU_MIN_WIDTH_COMPACT_PX = 160;
const ESTIMATED_MENU_HEIGHT_PX = 180;

const STATUS_STYLES: Record<SalaryStatus, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
};

const TRIGGER_SIZE_STYLES = {
  default: 'min-h-10 gap-1.5 px-4 py-2 text-sm font-semibold',
  compact: 'min-h-8 gap-1 px-3 py-1 text-xs font-medium',
} as const;

const BADGE_SIZE_STYLES = {
  default: 'px-3.5 py-1 text-sm font-semibold',
  compact: 'px-2.5 py-0.5 text-xs font-medium',
} as const;

const CHEVRON_SIZE_STYLES = {
  default: 'h-4 w-4',
  compact: 'h-3.5 w-3.5',
} as const;

interface SalaryStatusBadgeDropdownProps {
  status: SalaryStatus;
  pendingLabel: string;
  paidLabel: string;
  notAssignedLabel: string;
  disabled?: boolean;
  onStatusChange: (status: SalaryStatus) => void;
  size?: keyof typeof TRIGGER_SIZE_STYLES;
  className?: string;
}

export function SalaryStatusBadgeDropdown({
  status,
  pendingLabel,
  paidLabel,
  notAssignedLabel,
  disabled = false,
  onStatusChange,
  size = 'default',
  className,
}: SalaryStatusBadgeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<FixedDropdownPlacement | null>(null);

  const labels: Record<SalaryStatus, string> = {
    PENDING: pendingLabel,
    PAID: paidLabel,
  };

  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      setMenuPosition(null);
      return;
    }

    function updatePosition() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.max(
        rect.width,
        size === 'compact' ? MENU_MIN_WIDTH_COMPACT_PX : MENU_MIN_WIDTH_PX,
      );
      setMenuPosition(getFixedDropdownPlacement(rect, width, ESTIMATED_MENU_HEIGHT_PX));
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    function handleClickOutside(event: Event) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside);
    }, 0);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      clearTimeout(timeoutId);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen, size]);

  const handleSelect = (nextStatus: SalaryStatus) => {
    setIsOpen(false);
    if (nextStatus !== status) {
      onStatusChange(nextStatus);
    }
  };

  const menu =
    isOpen && !disabled && menuPosition && typeof window !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            className={cn(DROPDOWN_MENU_PORTAL_SURFACE_CLASS, size === 'compact' ? 'p-1.5' : 'p-2')}
            style={{
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
              maxHeight: `${menuPosition.maxHeight}px`,
              ...(menuPosition.top !== undefined ? { top: `${menuPosition.top}px` } : {}),
              ...(menuPosition.bottom !== undefined ? { bottom: `${menuPosition.bottom}px` } : {}),
            }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={cn(
                DROPDOWN_OPTION_BASE_CLASS,
                DROPDOWN_OPTION_INTERACTIVE_CLASS,
                'flex w-full items-center py-2',
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 text-slate-700',
                  BADGE_SIZE_STYLES[size],
                )}
              >
                {notAssignedLabel}
              </span>
            </button>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  DROPDOWN_OPTION_BASE_CLASS,
                  DROPDOWN_OPTION_INTERACTIVE_CLASS,
                  status === option && DROPDOWN_OPTION_SELECTED_CLASS,
                  'flex w-full items-center py-2',
                )}
              >
                <span
                  className={cn(
                    'inline-flex items-center whitespace-nowrap rounded-full',
                    BADGE_SIZE_STYLES[size],
                    STATUS_STYLES[option],
                  )}
                >
                  {labels[option]}
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'inline-flex items-center whitespace-nowrap rounded-full transition-opacity',
          TRIGGER_SIZE_STYLES[size],
          STATUS_STYLES[status],
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'hover:opacity-80',
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={labels[status]}
      >
        {labels[status]}
        <ChevronDown
          className={cn(
            DROPDOWN_CHEVRON_CLASS,
            CHEVRON_SIZE_STYLES[size],
            'opacity-70',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      {menu}
    </div>
  );
}
