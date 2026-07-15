'use client';

import { useTranslations } from 'next-intl';
import { AdminPaginationControls } from '@/shared/components/ui';

export interface AnalyticsMobilePaginationProps {
  page: number;
  totalPages: number;
  /** 1-based page jump for number buttons. */
  onGoToPage: (page1Based: number) => void;
}

export function AnalyticsMobilePagination({
  page,
  totalPages,
  onGoToPage,
}: AnalyticsMobilePaginationProps) {
  const tCommon = useTranslations('common');

  return (
    <div className="flex items-center justify-center border-t border-slate-200 px-4 py-3">
      <AdminPaginationControls
        page={Math.max(0, page - 1)}
        totalPages={Math.max(1, totalPages)}
        previousLabel={tCommon('previousPage')}
        nextLabel={tCommon('nextPage')}
        onPageChange={(next0Based) => onGoToPage(next0Based + 1)}
      />
    </div>
  );
}
