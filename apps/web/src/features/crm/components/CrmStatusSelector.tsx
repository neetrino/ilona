'use client';

import { useState, useRef, useEffect, useCallback, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
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

type DropdownPosition = { top: number; left: number; width: number };

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
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 140),
      });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    function handleClickOutside(event: MouseEvent) {
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
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const handleSelect = (e: React.MouseEvent, status: CrmLeadStatus) => {
    e.stopPropagation();
    onChange(status);
    setOpen(false);
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
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
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
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
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
