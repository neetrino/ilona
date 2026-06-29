'use client';

import { cn } from '@/shared/lib/utils';
import { useIsIPad } from '@/shared/hooks/useIsIPad';

type AdminListPaginationAlign = 'responsive' | 'between' | 'start';

export type AdminListPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  summary?: string;
  disabled?: boolean;
  align?: AdminListPaginationAlign;
  withFooter?: boolean;
  hideWhenSinglePage?: boolean;
  className?: string;
};

function pagerButtonClass(enabled: boolean) {
  return cn(
    'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0',
    enabled
      ? 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
      : 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]',
  );
}

export function AdminListPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  previousLabel,
  nextLabel,
  summary,
  disabled = false,
  align = 'responsive',
  withFooter = false,
  hideWhenSinglePage = true,
  className,
}: AdminListPaginationProps) {
  const isIPad = useIsIPad();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const hasItems = totalItems > 0;

  if (hideWhenSinglePage && totalItems <= pageSize) {
    return null;
  }

  const showingStart = hasItems ? safePage * pageSize + 1 : 0;
  const showingEnd = hasItems ? Math.min((safePage + 1) * pageSize, totalItems) : 0;
  const summaryText = summary ?? `${showingStart}-${showingEnd} / ${totalItems}`;
  const prevDisabled = disabled || safePage === 0 || !hasItems;
  const nextDisabled = disabled || safePage >= totalPages - 1 || !hasItems;

  const alignClass =
    align === 'start'
      ? 'justify-start gap-4'
      : align === 'between'
        ? 'justify-between'
        : isIPad
          ? 'justify-start gap-4'
          : 'justify-between lg:justify-start lg:gap-4';

  const content = (
    <div className={cn('flex items-center text-sm text-[#8b8b90]', alignClass)}>
      <span>{summaryText}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={pagerButtonClass(!prevDisabled)}
          disabled={prevDisabled}
          onClick={() => onPageChange(Math.max(0, safePage - 1))}
          aria-label={previousLabel}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
          {hasItems ? safePage + 1 : 0}
        </span>
        <button
          type="button"
          className={pagerButtonClass(!nextDisabled)}
          disabled={nextDisabled}
          onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
          aria-label={nextLabel}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  if (withFooter) {
    return (
      <div className={cn('border-t border-[rgba(14,14,16,0.07)] px-4 py-3 sm:px-5', className)}>
        {content}
      </div>
    );
  }

  return <div className={className}>{content}</div>;
}
