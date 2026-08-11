'use client';

import { useState, useRef, useEffect, useCallback, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { getFixedDropdownPlacement } from '@/shared/lib/dropdown-placement';
import type { CrmLeadStatus } from '@/features/crm/types';
import { useTranslations } from 'next-intl';
import { useCrmStatusLabels } from '@/features/crm/hooks/useCrmStatusLabels';
import {
  DROPDOWN_CHEVRON_CLASS,
  DROPDOWN_MENU_PORTAL_SURFACE_CLASS,
  DROPDOWN_OPTION_BASE_CLASS,
  DROPDOWN_OPTION_INTERACTIVE_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
  DROPDOWN_TRIGGER_BASE_CLASS,
  DROPDOWN_TRIGGER_DISABLED_CLASS,
  DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
} from '@/shared/components/ui/dropdown-theme';

const MENU_MIN_WIDTH_PX = 140;
const MENU_ESTIMATED_HEIGHT_PX = 280;

type DropdownPosition = { left: number; width: number; top?: number; bottom?: number; maxHeight?: number };

export interface CrmStatusSelectorProps {
  value: CrmLeadStatus | undefined;
  options: CrmLeadStatus[];
  onChange: (status: CrmLeadStatus) => void;
  disabled?: boolean;
  /** Shown as title/aria when `disabled` is true (e.g. Paid is final). */
  disabledHint?: string;
  className?: string;
  /** Optional id for the trigger (e.g. for form labels). */
  id?: string;
  /**
   * Where the menu opens relative to the trigger.
   * Defaults to auto-flipping upward when there is not enough space below.
   */
  menuPlacement?: 'bottom' | 'top' | 'auto';
  /**
   * Receives the portaled menu root element while the menu is open (null when closed).
   * Lets parent modals treat this surface as inside the dialog for outside-click handling.
   */
  portaledMenuRef?: RefObject<HTMLDivElement | null>;
}

/**
 * Reusable CRM status dropdown matching the visual design and behavior
 * of the status selector on CRM cards (LeadCard). Use in Edit Lead modal
 * and on cards for consistent UI.
 */
export function CrmStatusSelector({
  value,
  options,
  onChange,
  disabled = false,
  disabledHint,
  className,
  id,
  menuPlacement = 'auto',
  portaledMenuRef,
}: CrmStatusSelectorProps) {
  const t = useTranslations('crm');
  const statusLabels = useCrmStatusLabels();
  const resolvedDisabledHint = disabledHint ?? t('statusLockedAfterPayment');
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const setMenuElement = useCallback(
    (node: HTMLDivElement | null) => {
      menuRef.current = node;
      if (portaledMenuRef) {
        portaledMenuRef.current = node;
      }
    },
    [portaledMenuRef],
  );

  useEffect(() => {
    if (!open || !triggerRef.current) {
      setPosition(null);
      return;
    }

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const width = Math.max(rect.width, MENU_MIN_WIDTH_PX);
      const estimatedHeight = Math.min(
        MENU_ESTIMATED_HEIGHT_PX,
        16 + options.length * 44,
      );

      if (menuPlacement === 'top') {
        setPosition({
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          width,
        });
        return;
      }

      if (menuPlacement === 'bottom') {
        setPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width,
        });
        return;
      }

      const placement = getFixedDropdownPlacement(rect, width, estimatedHeight);
      setPosition({
        left: placement.left,
        width: placement.width,
        maxHeight: placement.maxHeight,
        ...(placement.top !== undefined ? { top: placement.top } : {}),
        ...(placement.bottom !== undefined ? { bottom: placement.bottom } : {}),
      });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    function handleClickOutside(event: Event) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside, true);
    }, 0);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      clearTimeout(timeoutId);
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [open, menuPlacement, options.length]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const handleSelect = (e: React.MouseEvent, status: CrmLeadStatus) => {
    e.stopPropagation();
    onChange(status);
    setOpen(false);
  };

  const handleTriggerPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    setOpen((prev) => !prev);
  };

  const displayValue = value ? (statusLabels[value] ?? value) : '—';
  const triggerTitle = disabled ? resolvedDisabledHint : t('changeStatus');
  const triggerAria = disabled ? resolvedDisabledHint : t('changeStatus');

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onPointerDown={handleTriggerPointerDown}
        disabled={disabled}
        className={cn(
          'w-full min-h-11 inline-flex items-center justify-between gap-2 !border-2 !border-slate-300 !bg-slate-50/40 py-2 text-sm font-semibold text-slate-800 shadow-sm',
          DROPDOWN_TRIGGER_BASE_CLASS,
          DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
          DROPDOWN_TRIGGER_DISABLED_CLASS,
          open && '!border-[#1010a3]/55 !bg-white shadow-[0_10px_24px_rgba(16,16,163,0.16)]',
          disabled && 'opacity-60'
        )}
        title={triggerTitle}
        aria-label={triggerAria}
        aria-expanded={open}
      >
        <span>{displayValue}</span>
        <ChevronDown
          className={cn(DROPDOWN_CHEVRON_CLASS, open && 'rotate-180')}
        />
      </button>
      {open &&
        !disabled &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={setMenuElement}
            className={cn(DROPDOWN_MENU_PORTAL_SURFACE_CLASS, 'min-w-[140px]')}
            style={{
              ...(position.top !== undefined ? { top: `${position.top}px` } : {}),
              ...(position.bottom !== undefined ? { bottom: `${position.bottom}px` } : {}),
              left: `${position.left}px`,
              width: `${position.width}px`,
              ...(position.maxHeight !== undefined
                ? { maxHeight: `${position.maxHeight}px` }
                : {}),
            }}
          >
            <div className="space-y-1 px-1 py-1">
              {options.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={(e) => handleSelect(e, status)}
                  className={cn(
                    DROPDOWN_OPTION_BASE_CLASS,
                    DROPDOWN_OPTION_INTERACTIVE_CLASS,
                    value === status && DROPDOWN_OPTION_SELECTED_CLASS
                  )}
                >
                  {statusLabels[status] ?? status}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
