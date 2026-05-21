'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { usePortalShell } from '@/shared/context/portal-shell-context';
import {
  portalSpinnerClass,
  portalTableBodyClass,
  portalTableChromeClass,
  portalTableHeadCellClass,
  portalTableHeadRowClass,
  portalTableRowClass,
} from '@/shared/lib/portal-theme';

interface Column<T> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  render?: (item: T, index?: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  tableClassName?: string;
  containerClassName?: string;
  compact?: boolean;
  disableHorizontalScroll?: boolean;
  /** When true, omit outer card chrome so the table can sit inside a parent card (e.g. with a header strip). */
  embedInParentCard?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  sortBy,
  sortOrder,
  onSort,
  tableClassName,
  containerClassName,
  compact = false,
  disableHorizontalScroll = false,
  embedInParentCard = false,
}: DataTableProps<T>) {
  const isPortal = usePortalShell();

  const outerChrome = embedInParentCard
    ? 'overflow-hidden'
    : isPortal
      ? portalTableChromeClass
      : 'overflow-hidden rounded-2xl border border-slate-200 bg-white';

  const headRowClass = isPortal ? portalTableHeadRowClass : 'border-b border-slate-100';
  const headCellBase = isPortal
    ? portalTableHeadCellClass
    : 'text-xs font-semibold uppercase tracking-wider text-slate-500';
  const bodyClass = isPortal ? portalTableBodyClass : 'divide-y divide-slate-100';
  const rowHoverClass = isPortal ? portalTableRowClass : 'transition-colors hover:bg-slate-50';
  const emptyCellClass = isPortal ? 'text-[#8b8b90]' : 'text-slate-500';
  const sortBtnHover = isPortal ? 'hover:bg-[#fafafa]' : 'hover:bg-slate-50';
  const sortBtnFocus = isPortal
    ? 'focus:ring-[#1010a3]/20'
    : 'focus:ring-slate-400 focus:ring-offset-1';
  const sortActiveText = isPortal ? 'text-[#1010a3]' : 'text-slate-700';
  const sortIconActive = isPortal ? 'text-[#3b3b40]' : 'text-slate-600';
  const sortIconMuted = isPortal ? 'text-[#8b8b90]' : 'text-slate-400';

  if (isLoading) {
    return (
      <div className={cn('p-12', embedInParentCard ? '' : outerChrome)}>
        <div className="flex items-center justify-center">
          <div
            className={
              isPortal
                ? portalSpinnerClass
                : 'h-8 w-8 animate-spin rounded-full border-b-2 border-primary'
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(outerChrome)}>
      <div
        className={cn(
          'w-full',
          disableHorizontalScroll ? 'overflow-x-hidden' : 'overflow-x-auto',
          containerClassName,
        )}
      >
        <table
          className={cn('w-full table-auto', !disableHorizontalScroll && 'min-w-max', tableClassName)}
        >
          <thead>
            <tr className={headRowClass}>
              {columns.map((column) => {
                const isSorted = sortBy === column.key;
                const isAscending = isSorted && sortOrder === 'asc';

                const headerText =
                  typeof column.header === 'string'
                    ? column.header
                    : column.key.charAt(0).toUpperCase() +
                      column.key.slice(1).replace(/([A-Z])/g, ' $1');

                const isCenter = column.className?.includes('text-center');
                const isRight = column.className?.includes('text-right');
                const headerAlignment = isRight
                  ? 'text-right'
                  : isCenter
                    ? 'text-center'
                    : 'text-left';
                const headerJustify = isRight
                  ? 'justify-end'
                  : isCenter
                    ? 'justify-center'
                    : 'justify-start';

                return (
                  <th
                    key={column.key}
                    className={cn(
                      compact ? 'px-3 py-3' : 'px-4 py-3 sm:px-6 sm:py-4',
                      headCellBase,
                      column.className,
                      headerAlignment,
                    )}
                  >
                    {column.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.key)}
                        className={cn(
                          'flex w-full items-center gap-1.5 rounded-md px-0 py-0.5 text-xs font-semibold uppercase transition-colors focus:outline-none focus:ring-2',
                          sortBtnHover,
                          sortBtnFocus,
                          isSorted && sortActiveText,
                          headerJustify,
                        )}
                        aria-label={
                          !isSorted
                            ? `Sort by ${headerText}`
                            : isAscending
                              ? `Sorted by ${headerText} ascending. Click to sort descending.`
                              : `Sorted by ${headerText} descending. Click to sort ascending.`
                        }
                      >
                        <span>{column.header}</span>
                        <span className="flex-shrink-0">
                          {isSorted ? (
                            isAscending ? (
                              <ArrowUp className={cn('h-3.5 w-3.5', sortIconActive)} aria-hidden />
                            ) : (
                              <ArrowDown className={cn('h-3.5 w-3.5', sortIconActive)} aria-hidden />
                            )
                          ) : (
                            <ArrowUpDown className={cn('h-3.5 w-3.5', sortIconMuted)} aria-hidden />
                          )}
                        </span>
                      </button>
                    ) : (
                      <div
                        className={cn(
                          'flex items-center gap-1.5 text-xs font-semibold uppercase',
                          headerJustify,
                        )}
                      >
                        {column.header}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={bodyClass}>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={cn('px-6 py-12 text-center text-sm', emptyCellClass)}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(rowHoverClass, onRowClick && 'cursor-pointer')}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(compact ? 'px-3 py-3' : 'px-4 py-3 sm:px-6 sm:py-4', column.className)}
                    >
                      {column.render
                        ? column.render(item, index)
                        : ((item as Record<string, unknown>)[column.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
