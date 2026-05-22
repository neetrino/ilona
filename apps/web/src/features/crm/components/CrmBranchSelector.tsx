'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

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
          'w-full min-h-11 inline-flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#2f2f35] hover:border-[#1010a3]/30 focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10',
          disabled && 'opacity-60 pointer-events-none'
        )}
        title="Change branch"
        aria-label="Change branch"
        aria-expanded={open}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform', open && 'rotate-180')} />
      </button>
      {open &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
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
                'w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50',
                !value && 'bg-[#ecefff] font-medium text-[#1010a3]'
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
                  'w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50',
                  value === branch.id && 'bg-[#ecefff] font-medium text-[#1010a3]'
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
