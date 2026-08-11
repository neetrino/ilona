'use client';

import { addMonths, format, isSameDay, isSameMonth, setYear } from 'date-fns';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { DatePickerYearDropdown } from '../date-picker-year-dropdown';
import {
  DATE_PICKER_POPOVER_ATTR,
  MOBILE_CALENDAR_Z_CLASS,
  WEEKDAYS,
} from './date-picker-input.constants';
import type { DatePickerInputViewModel } from './date-picker-input.types';

interface DatePickerCalendarPopoverProps {
  vm: DatePickerInputViewModel;
}

export function DatePickerCalendarPopover({ vm }: DatePickerCalendarPopoverProps) {
  if (!vm.open || !vm.popoverPosition) return null;

  return (
    <div
      ref={vm.popoverRef}
      id={`${vm.triggerId}-dialog`}
      {...{ [DATE_PICKER_POPOVER_ATTR]: '' }}
      role="dialog"
      aria-label={vm.placeholder || vm.tCommon('date')}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        position: vm.popoverPosition.positionMode,
        left: vm.popoverPosition.left,
        top: vm.popoverPosition.top,
        width: vm.popoverPosition.width,
        boxSizing: 'border-box',
        zIndex: 9999,
      }}
      className={cn(
        MOBILE_CALENDAR_Z_CLASS,
        'pointer-events-auto relative overflow-visible min-w-[300px] max-w-[calc(100vw-1rem)] rounded-[1.25rem]',
        'border border-slate-200 bg-white p-3 shadow-[0_20px_48px_rgba(15,23,42,0.16)]',
        vm.popoverPosition.placement === 'below' ? 'origin-top' : 'origin-bottom',
      )}
    >
      <div className="relative z-10 mb-2 flex items-center justify-between gap-1">
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => {
            vm.setYearDropdownOpen(false);
            vm.setMonthDate((prev) => addMonths(prev, -1));
          }}
          className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 min-[1367px]:h-8 min-[1367px]:w-8"
          aria-label={vm.tCommon('previousMonth')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 items-center justify-center gap-1.5">
          <span className="truncate text-sm font-semibold capitalize text-slate-900 min-[1367px]:text-base">
            {vm.monthName}
          </span>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              vm.handleYearToggle();
            }}
            className={cn(
              'inline-flex min-h-9 shrink-0 touch-manipulation items-center gap-0.5 rounded-md px-2 py-1 text-sm font-semibold tabular-nums text-[#2d329f] hover:bg-slate-100 min-[1367px]:min-h-0 min-[1367px]:px-1.5 min-[1367px]:py-0.5 min-[1367px]:text-base',
              vm.yearDropdownOpen && 'bg-slate-100',
            )}
            aria-expanded={vm.yearDropdownOpen}
            aria-haspopup="listbox"
          >
            {vm.visibleYear}
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform',
                vm.yearDropdownOpen && 'rotate-180',
              )}
            />
          </button>
        </div>

        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => {
            vm.setYearDropdownOpen(false);
            vm.setMonthDate((prev) => addMonths(prev, 1));
          }}
          className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 min-[1367px]:h-8 min-[1367px]:w-8"
          aria-label={vm.tCommon('nextMonth')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {vm.yearDropdownOpen ? (
        <div
          className={cn(
            'absolute z-30 rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]',
            vm.isMobileLayout ? 'inset-x-1 top-10' : 'left-1/2 top-9 w-44 -translate-x-1/2',
          )}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <DatePickerYearDropdown
            years={vm.yearOptions}
            selectedYear={vm.visibleYear}
            compact={vm.isMobileLayout}
            onSelectYear={(year) => {
              vm.setMonthDate((prev) => setYear(prev, year));
              vm.setYearDropdownOpen(false);
            }}
          />
        </div>
      ) : null}

      <div
        className="grid grid-cols-7 gap-x-0.5 gap-y-0.5 pb-1 text-center text-[10px] font-semibold tracking-wide text-slate-500"
        onPointerDown={() => vm.setYearDropdownOpen(false)}
      >
        {WEEKDAYS.map((weekday, index) => (
          <div
            key={weekday}
            className={cn(
              'min-w-0 truncate',
              (index === 5 || index === 6) && 'text-[#b06d6d]',
            )}
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {vm.days.map((day) => {
          const inMonth = isSameMonth(day, vm.monthDate);
          const selected = vm.selectedDate ? isSameDay(day, vm.selectedDate) : false;
          const isToday = isSameDay(day, new Date());
          const weekend = day.getDay() === 0 || day.getDay() === 6;
          const outOfRange = vm.isOutOfRange(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => vm.selectDate(day)}
              disabled={outOfRange}
              className={cn(
                vm.popoverPosition?.matchFormWidth
                  ? 'flex aspect-square w-full max-h-8 items-center justify-center rounded-full text-[0.88rem] font-medium leading-none transition-colors'
                  : 'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[0.88rem] font-medium leading-none transition-colors',
                selected && 'bg-[#2d329f] text-white',
                !selected && isToday && 'rounded-md border border-[#3036b6]/45',
                !selected && inMonth && 'text-slate-900 hover:bg-slate-100',
                !selected && !inMonth && 'text-slate-300 hover:bg-slate-100',
                !selected && weekend && inMonth && 'text-[#a56363]',
                outOfRange && 'cursor-not-allowed opacity-35 hover:bg-transparent',
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
        <button
          type="button"
          onClick={vm.handleClear}
          disabled={!vm.allowClear || vm.required}
          className="text-xs font-semibold text-[#3036b6] hover:underline disabled:opacity-40"
        >
          {vm.tCommon('clear')}
        </button>
        <button
          type="button"
          onClick={vm.handleToday}
          className="text-xs font-semibold text-[#3036b6] hover:underline"
        >
          {vm.tCommon('today')}
        </button>
      </div>
    </div>
  );
}
