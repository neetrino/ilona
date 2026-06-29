'use client';

import { cn } from '@/shared/lib/utils';

interface DatePickerYearDropdownProps {
  years: number[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
  compact?: boolean;
}

export function DatePickerYearDropdown({
  years,
  selectedYear,
  onSelectYear,
  compact = false,
}: DatePickerYearDropdownProps) {
  return (
    <div
      className={cn(
        'grid max-h-48 gap-0.5 overflow-y-auto overscroll-y-contain p-1 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]',
        compact ? 'grid-cols-4' : 'grid-cols-3'
      )}
    >
      {years.map((year) => (
        <button
          key={year}
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onSelectYear(year);
          }}
          className={cn(
            'rounded-lg px-2 py-2.5 text-sm font-medium transition-colors touch-manipulation',
            year === selectedYear ? 'bg-[#2d329f] text-white' : 'text-slate-900 hover:bg-slate-100'
          )}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
