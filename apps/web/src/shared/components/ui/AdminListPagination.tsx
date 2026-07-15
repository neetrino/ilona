'use client';

import { cn } from '@/shared/lib/utils';
import { AdminPaginationControls } from './AdminPaginationControls';

type AdminListPaginationAlign = 'responsive' | 'between' | 'start' | 'end' | 'center';

export type AdminListPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  disabled?: boolean;
  align?: AdminListPaginationAlign;
  withFooter?: boolean;
  hideWhenSinglePage?: boolean;
  className?: string;
};

export function AdminListPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  previousLabel,
  nextLabel,
  disabled = false,
  align = 'responsive',
  withFooter = false,
  hideWhenSinglePage = true,
  className,
}: AdminListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const hasItems = totalItems > 0;

  if (hideWhenSinglePage && totalItems <= pageSize) {
    return null;
  }

  const alignClass =
    align === 'end'
      ? 'justify-end'
      : align === 'center'
        ? 'justify-center'
        : align === 'between'
          ? 'justify-between'
          : align === 'responsive'
            ? 'justify-center lg:justify-start'
            : 'justify-center lg:justify-start';

  const content = (
    <div className={cn('flex items-center', alignClass)}>
      <AdminPaginationControls
        page={safePage}
        totalPages={hasItems ? totalPages : 1}
        onPageChange={onPageChange}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
        disabled={disabled || !hasItems}
      />
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
