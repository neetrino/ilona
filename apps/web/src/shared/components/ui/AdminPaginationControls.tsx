'use client';

import { cn } from '@/shared/lib/utils';

/**
 * Sliding pair before the last page:
 * page 1 → `1 2 . . . 5`
 * page 2 → `2 3 . . . 5`
 * page 3 → `3 4 5` (near the end)
 */
export function getAdminPaginationItems(
  currentPage1Based: number,
  totalPages: number,
): Array<number | 'ellipsis'> {
  if (totalPages <= 1) return [1];
  if (totalPages === 2) return [1, 2];
  if (totalPages === 3) return [1, 2, 3];

  const current = Math.min(Math.max(1, currentPage1Based), totalPages);

  if (current >= totalPages) {
    return [totalPages - 1, totalPages];
  }

  if (current + 1 >= totalPages) {
    return [current, totalPages];
  }

  if (current + 1 === totalPages - 1) {
    return [current, current + 1, totalPages];
  }

  return [current, current + 1, 'ellipsis', totalPages];
}

const PILL_ACTIVE =
  'bg-[#1010a3] text-white hover:bg-[#0d0d8a] disabled:bg-[#1010a3] disabled:text-white';
const PILL_MUTED =
  'border border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]';
const PILL_IDLE =
  'border border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]';

export type AdminPaginationControlsProps = {
  /** 0-based page index */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  disabled?: boolean;
  className?: string;
};

export function AdminPaginationControls({
  page,
  totalPages,
  onPageChange,
  previousLabel,
  nextLabel,
  disabled = false,
  className,
}: AdminPaginationControlsProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(0, page), safeTotalPages - 1);
  const current1Based = safePage + 1;
  const items = getAdminPaginationItems(current1Based, safeTotalPages);
  const firstDisabled = disabled || safePage === 0;
  const lastDisabled = disabled || safePage >= safeTotalPages - 1;

  return (
    <div
      className={cn(
        'relative z-10 flex w-full items-center justify-center gap-2 lg:justify-start',
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          'inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:outline-none',
          firstDisabled ? PILL_MUTED : PILL_ACTIVE,
        )}
        disabled={firstDisabled}
        onClick={() => onPageChange(0)}
        aria-label={previousLabel}
      >
        First
      </button>

      {items.map((item, index) => {
        if (item === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${index}`}
              className={cn(
                'pointer-events-none inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                PILL_MUTED,
              )}
              aria-hidden
            >
              ...
            </span>
          );
        }

        const active = item === current1Based;
        const pageIndex = item - 1;
        const pageDisabled = disabled;
        return (
          <button
            key={`page-${item}`}
            type="button"
            className={cn(
              'relative z-10 inline-flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full text-sm font-semibold transition-colors focus:outline-none focus-visible:outline-none',
              active ? PILL_ACTIVE : PILL_IDLE,
              pageDisabled && 'cursor-default opacity-60',
              active && !pageDisabled && 'cursor-default',
            )}
            disabled={pageDisabled}
            aria-current={active ? 'page' : undefined}
            aria-label={`Page ${item}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (pageDisabled || active) return;
              onPageChange(pageIndex);
            }}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        className={cn(
          'inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:outline-none',
          lastDisabled ? PILL_MUTED : PILL_ACTIVE,
        )}
        disabled={lastDisabled}
        onClick={() => onPageChange(safeTotalPages - 1)}
        aria-label={nextLabel}
      >
        Last
      </button>
    </div>
  );
}
