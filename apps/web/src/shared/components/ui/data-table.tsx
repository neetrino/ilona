'use client';

import { cn } from '@/shared/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  render?: (item: T, index?: number) => React.ReactNode;
  className?: string;
  width?: string; // CSS width value (e.g., '200px', '15%', 'auto')
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
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed min-w-[800px]">
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width || 'auto' }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((column) => {
              const isSorted = sortBy === column.key;
              const isAscending = isSorted && sortOrder === 'asc';
              const isDescending = isSorted && sortOrder === 'desc';
              
              // Extract header text for aria-label (handle both string and ReactNode)
              const headerText = typeof column.header === 'string' 
                ? column.header 
                : column.key.charAt(0).toUpperCase() + column.key.slice(1).replace(/([A-Z])/g, ' $1');
              
              // Extract padding classes from column className
              const paddingMatch = column.className?.match(/(pr-\d+|pl-\d+|px-\d+)/);
              const paddingClass = paddingMatch ? paddingMatch[0] : '';
              
              return (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider',
                    column.className?.includes('text-right') ? 'text-right' : 
                    column.className?.includes('text-center') ? 'text-center' : 'text-left',
                    paddingClass && paddingClass
                  )}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className={cn(
                        'flex items-center gap-1.5 w-full text-xs font-semibold uppercase hover:bg-slate-50 rounded-md px-0 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1',
                        column.className?.includes('text-right') ? 'text-right justify-end' : 
                        column.className?.includes('text-center') ? 'text-center justify-center' : 'text-left justify-start',
                        isSorted && 'text-slate-700'
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
                            <ArrowUp className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        )}
                      </span>
                    </button>
                  ) : (
                    <div className={cn(
                      'flex items-center gap-1.5 text-xs font-semibold uppercase',
                      column.className?.includes('text-right') ? 'justify-end' :
                      column.className?.includes('text-center') ? 'justify-center' : 'justify-start'
                    )}>
                      {column.header}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'hover:bg-slate-50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((column) => (
                  <td 
                    key={column.key} 
                    className={cn(
                      'px-4 py-4 align-middle',
                      column.className?.includes('text-right') ? 'text-right' : 
                      column.className?.includes('text-center') ? 'text-center' : 'text-left',
                      column.className
                    )}
                  >
                    {column.render
                      ? column.render(item, index)
                      : (item as Record<string, unknown>)[column.key] as React.ReactNode}
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

