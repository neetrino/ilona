'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  DROPDOWN_CHEVRON_CLASS,
  DROPDOWN_MENU_PORTAL_SURFACE_CLASS,
  DROPDOWN_OPTION_BASE_CLASS,
  DROPDOWN_OPTION_INTERACTIVE_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
} from '@/shared/components/ui/dropdown-theme';
import type { PaymentStatus } from '@/features/finance';

const STATUS_OPTIONS: PaymentStatus[] = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'];
const MENU_MIN_WIDTH_PX = 192;
const MENU_MIN_WIDTH_COMPACT_PX = 176;

const STATUS_STYLES: Record<PaymentStatus, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  REFUNDED: 'bg-slate-100 text-slate-600',
};

const OUTLINED_STATUS_STYLES: Record<PaymentStatus, string> = {
  PAID: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  PENDING: 'border-amber-300 bg-amber-50 text-amber-700',
  OVERDUE: 'border-red-300 bg-red-50 text-red-700',
  CANCELLED: 'border-slate-300 bg-slate-100 text-slate-600',
  REFUNDED: 'border-slate-300 bg-slate-100 text-slate-600',
};

const TRIGGER_SIZE_STYLES = {
  default: 'min-h-10 gap-1.5 px-4 py-2 text-sm font-semibold',
  compact: 'min-h-8 gap-1 px-3 py-1 text-xs font-medium',
} as const;

const OUTLINED_TRIGGER_STYLE = 'gap-1 rounded-xl border px-3 py-1 text-sm font-medium';

const BADGE_SIZE_STYLES = {
  default: 'px-3.5 py-1 text-sm font-semibold',
  compact: 'px-2.5 py-0.5 text-xs font-medium',
  outlined: 'rounded-xl border px-3 py-1 text-sm font-medium',
} as const;

const CHEVRON_SIZE_STYLES = {
  default: 'h-4 w-4',
  compact: 'h-3.5 w-3.5',
  outlined: 'h-3.5 w-3.5',
} as const;

interface PaymentStatusBadgeDropdownProps {
  status: PaymentStatus;
  labels: Record<PaymentStatus, string>;
  notAssignedLabel: string;
  disabled?: boolean;
  onStatusChange: (status: PaymentStatus) => void;
  size?: keyof typeof TRIGGER_SIZE_STYLES;
  appearance?: 'pill' | 'outlined';
  className?: string;
}

export function PaymentStatusBadgeDropdown({
  status,
  labels,
  notAssignedLabel,
  disabled = false,
  onStatusChange,
  size = 'default',
  appearance = 'pill',
  className,
}: PaymentStatusBadgeDropdownProps) {
  const isOutlined = appearance === 'outlined';
  const menuSize = isOutlined ? 'outlined' : size;
  const statusStyles = isOutlined ? OUTLINED_STATUS_STYLES : STATUS_STYLES;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

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
        isOutlined ? MENU_MIN_WIDTH_COMPACT_PX : size === 'compact' ? MENU_MIN_WIDTH_COMPACT_PX : MENU_MIN_WIDTH_PX,
      );
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - width,
        width,
      });
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
  }, [isOpen, size, isOutlined]);

  const handleSelect = (nextStatus: PaymentStatus) => {
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
            className={cn(DROPDOWN_MENU_PORTAL_SURFACE_CLASS, menuSize === 'default' ? 'p-2' : 'p-1.5')}
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
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
                  'inline-flex items-center whitespace-nowrap bg-slate-100 text-slate-700',
                  isOutlined
                    ? 'rounded-xl border border-slate-300 px-3 py-1 text-sm font-medium'
                    : cn('rounded-full', BADGE_SIZE_STYLES[size]),
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
                    'inline-flex items-center whitespace-nowrap',
                    isOutlined
                      ? cn(BADGE_SIZE_STYLES.outlined, OUTLINED_STATUS_STYLES[option])
                      : cn('rounded-full', BADGE_SIZE_STYLES[size], STATUS_STYLES[option]),
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
          'inline-flex items-center whitespace-nowrap transition-opacity',
          isOutlined
            ? cn(OUTLINED_TRIGGER_STYLE, statusStyles[status])
            : cn('rounded-full', TRIGGER_SIZE_STYLES[size], statusStyles[status]),
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
            CHEVRON_SIZE_STYLES[menuSize],
            'opacity-70',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      {menu}
    </div>
  );
}

function buildPaymentStatusLabels(t: (key: string) => string): Record<PaymentStatus, string> {
  return {
    PENDING: t('pending'),
    PAID: t('paid'),
    OVERDUE: t('overdue'),
    CANCELLED: t('cancelled'),
    REFUNDED: t('refunded'),
  };
}

export { buildPaymentStatusLabels };
