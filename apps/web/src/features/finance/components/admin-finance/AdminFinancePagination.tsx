'use client';

import { useTranslations } from 'next-intl';
import { AdminListPagination } from '@/shared/components/ui';

type AdminFinancePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function AdminFinancePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: AdminFinancePaginationProps) {
  const tCommon = useTranslations('common');

  if (total <= 0) {
    return null;
  }

  return (
    <AdminListPagination
      page={page}
      pageSize={pageSize}
      totalItems={total}
      onPageChange={onPageChange}
      previousLabel={tCommon('previousPage')}
      nextLabel={tCommon('nextPage')}
      hideWhenSinglePage={false}
    />
  );
}
