'use client';

import { cn } from '@/shared/lib/utils';

interface GroupsSearchResultsBarProps {
  count: number;
  label: string;
  unitLabel: string;
  ariaLabel?: string;
  className?: string;
}

export function GroupsSearchResultsBar({
  count,
  label,
  unitLabel,
  ariaLabel,
  className,
}: GroupsSearchResultsBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white px-3.5 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.06)] animate-in fade-in-0 slide-in-from-top-1 duration-200',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0f0ff] text-[#1010a3]">
        <svg
          className="h-[1.125rem] w-[1.125rem]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[#8b8b90]">
          {label}
        </p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-xl font-bold leading-none tabular-nums tracking-tight text-[#1010a3]">
            {count}
          </span>
          <span className="text-sm font-semibold text-[#3b3b40]">{unitLabel}</span>
        </p>
      </div>
    </div>
  );
}
