'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
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

export interface CrmBranchOption {
  id: string;
  name: string;
}

export interface CrmBranchSelectorProps {
  value: string | null | undefined;
  options: CrmBranchOption[];
  onChange: (centerId: string | null) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function CrmBranchSelector({
  value,
  options,
  onChange,
  disabled = false,
  className,
  id,
}: CrmBranchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
        width: Math.max(rect.width, 160),
      });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
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

  const selected = options.find((option) => option.id === value);
  const displayValue = selected?.name ?? 'No branch';

  const handleSelect = (e: React.MouseEvent, centerId: string | null) => {
    e.stopPropagation();
    onChange(centerId);
    setOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className={cn(
          'w-full min-h-11 inline-flex items-center justify-between gap-2 !border-2 !border-slate-300 !bg-slate-50/40 py-2 text-sm font-semibold text-slate-800 shadow-sm',
          DROPDOWN_TRIGGER_BASE_CLASS,
          DROPDOWN_TRIGGER_INTERACTIVE_CLASS,
          DROPDOWN_TRIGGER_DISABLED_CLASS,
          open && '!border-[#1010a3]/55 !bg-white shadow-[0_10px_24px_rgba(16,16,163,0.16)]',
          disabled && 'opacity-60 pointer-events-none'
        )}
        title="Change branch"
        aria-label="Change branch"
        aria-expanded={open}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={cn(DROPDOWN_CHEVRON_CLASS, open && 'rotate-180')} />
      </button>
      {open &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className={cn(DROPDOWN_MENU_PORTAL_SURFACE_CLASS, 'min-w-[160px]')}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
            }}
          >
            <button
              type="button"
              onClick={(e) => handleSelect(e, null)}
              className={cn(
                DROPDOWN_OPTION_BASE_CLASS,
                DROPDOWN_OPTION_INTERACTIVE_CLASS,
                !value && DROPDOWN_OPTION_SELECTED_CLASS
              )}
            >
              No branch
            </button>
            {options.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={(e) => handleSelect(e, branch.id)}
                className={cn(
                  DROPDOWN_OPTION_BASE_CLASS,
                  DROPDOWN_OPTION_INTERACTIVE_CLASS,
                  value === branch.id && DROPDOWN_OPTION_SELECTED_CLASS
                )}
              >
                {branch.name}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
