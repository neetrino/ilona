'use client';

import { cn } from '@/shared/lib/utils';

type StudentAccountStatusBadgeProps = {
  isActive: boolean;
  activeLabel: string;
  inactiveLabel: string;
  className?: string;
};

export function StudentAccountStatusBadge({
  isActive,
  activeLabel,
  inactiveLabel,
  className,
}: StudentAccountStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        isActive
          ? 'border border-emerald-200/90 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 shadow-[0_1px_2px_rgba(16,185,129,0.12)]'
          : 'border border-[rgba(14,14,16,0.08)] bg-gradient-to-r from-[#f6f6f7] to-[#efeff1] text-[#5c5c63] shadow-[0_1px_2px_rgba(14,14,16,0.06)]',
        className,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        {isActive ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
          </>
        ) : (
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9a9aa0] ring-2 ring-[#e8e8ea]" />
        )}
      </span>
      {isActive ? activeLabel : inactiveLabel}
    </span>
  );
}
