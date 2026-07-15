'use client';

import type { useTranslations } from 'next-intl';
import { AdminListPagination } from '@/shared/components/ui';
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
  pageSize,
  totalItems,
  onPageChange,
  className,
  t,
}: BoardCardsPaginationProps) {
  return (
    <AdminListPagination
      page={currentPage}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageChange={onPageChange}
      previousLabel={t('previousCardsPage')}
      nextLabel={t('nextCardsPage')}
      className={cn(className)}
    />
  );
}
