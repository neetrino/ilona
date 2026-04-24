'use client';

import { useState, useRef, useEffect, useCallback, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { CrmLeadStatus } from '@/features/crm/types';
import { STATUS_LABELS } from '@/features/crm/types';

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
  disabledHint = 'Status cannot be changed after payment',
  className,
  id,
  portaledMenuRef,
}: CrmStatusSelectorProps) {
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

  const displayValue = value ? (STATUS_LABELS[value] ?? value) : '—';
  const triggerTitle = disabled ? disabledHint : 'Change status';
  const triggerAria = disabled ? disabledHint : 'Change status';

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
          'w-full inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        title={triggerTitle}
        aria-label={triggerAria}
        aria-expanded={open}
      >
        <span>{displayValue}</span>
        <ChevronDown
          className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open &&
        !disabled &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={setMenuElement}
            className="fixed z-[9999] min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
            }}
          >
            {options.map((status) => (
              <button
                key={status}
                type="button"
                onClick={(e) => handleSelect(e, status)}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50',
                  value === status && 'bg-primary/10 font-medium text-primary'
                )}
              >
                {STATUS_LABELS[status] ?? status}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
