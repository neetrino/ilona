'use client';

import type { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';

interface BoardCardsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
  t: ReturnType<typeof useTranslations<'groups'>>;
}

export function BoardCardsPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  className,
  t,
}: BoardCardsPaginationProps) {
  if (totalItems <= pageSize) {
    return null;
  }

  return (
    <div className={cn('flex items-center justify-between text-sm text-[#8b8b90]', className)}>
      <span>
        {currentPage * pageSize + 1}-
        {Math.min((currentPage + 1) * pageSize, totalItems)} / {totalItems}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
            currentPage === 0
              ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
              : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
          }`}
          disabled={currentPage === 0}
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          aria-label={t('previousCardsPage')}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
          {currentPage + 1}
        </span>
        <button
          type="button"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
            currentPage >= totalPages - 1
              ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
              : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
          }`}
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          aria-label={t('nextCardsPage')}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
