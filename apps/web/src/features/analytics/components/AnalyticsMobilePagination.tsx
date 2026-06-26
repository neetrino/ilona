'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';

export interface AnalyticsMobilePaginationProps {
  page: number;
  totalPages: number;
  start: number;
  end: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function AnalyticsMobilePagination({
  page,
  totalPages,
  start,
  end,
  total,
  onPrevious,
  onNext,
}: AnalyticsMobilePaginationProps) {
  const tCommon = useTranslations('common');
  return (
    <div className="flex items-center justify-start gap-3 border-t border-slate-200 px-4 py-3 text-sm text-[#8b8b90]">
      <span>
        {start}-{end} / {total}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
            page <= 1
              ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
              : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]',
          )}
          disabled={page <= 1}
          onClick={onPrevious}
          aria-label={tCommon('previousPage')}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
          {page}
        </span>
        <button
          type="button"
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
            page >= totalPages
              ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
              : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]',
          )}
          disabled={page >= totalPages}
          onClick={onNext}
          aria-label={tCommon('nextPage')}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
