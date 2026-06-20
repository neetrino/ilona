'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  setYear,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { enUS, hy } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import { DatePickerYearDropdown } from './date-picker-year-dropdown';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DESKTOP_MIN_WIDTH = 1367;
const MOBILE_POPOVER_WIDTH = 264;
const MOBILE_CALENDAR_BACKDROP_Z_CLASS = 'z-[9998]';
const MOBILE_CALENDAR_Z_CLASS = 'z-[9999]';
const ESTIMATED_POPOVER_HEIGHT = 390;
const VIEWPORT_PADDING = 8;

interface PopoverPosition {
  left: number;
  top: number;
  width: number;
  placement: 'above' | 'below';
  matchFormWidth: boolean;
  positionMode: 'fixed' | 'absolute';
}

function resolvePortalContainer(root: HTMLDivElement | null): HTMLElement {
  if (!root) return document.body;
  const dialog = root.closest('[role="dialog"]');
  return (dialog as HTMLElement | null) ?? document.body;
}

export interface DatePickerInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  allowClear?: boolean;
}

function parseValue(value?: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function createCalendarDays(monthDate: Date): Date[] {
  const firstDay = startOfMonth(monthDate);
  const calendarStart = startOfWeek(firstDay, { weekStartsOn: 1 });
  return Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));
}

function toDateString(value?: string | number | readonly string[]): string {
  if (!value || Array.isArray(value)) return '';
  return String(value);
}

function isDesktopViewport(): boolean {
  return window.innerWidth >= DESKTOP_MIN_WIDTH;
}

function getYearBounds(min?: string | number | readonly string[], max?: string | number | readonly string[]) {
  const currentYear = new Date().getFullYear();
  const minStr = toDateString(min);
  const maxStr = toDateString(max);
  const minYear =
    minStr && ISO_DATE_RE.test(minStr) ? parseISO(minStr).getFullYear() : currentYear - 120;
  const maxYear =
    maxStr && ISO_DATE_RE.test(maxStr) ? parseISO(maxStr).getFullYear() : currentYear + 10;
  return { minYear, maxYear };
}

function buildYearList(minYear: number, maxYear: number): number[] {
  const years: number[] = [];
  for (let year = maxYear; year >= minYear; year -= 1) {
    years.push(year);
  }
  return years;
}

export const DatePickerInput = React.forwardRef<HTMLInputElement, DatePickerInputProps>(
  (
    {
      id,
      name,
      value,
      defaultValue,
      onChange,
      onValueChange,
      onBlur,
      min,
      max,
      disabled,
      required,
      className,
      placeholder,
      allowClear = true,
      ...rest
    },
    ref
  ) => {
    const locale = useLocale();
    const tCommon = useTranslations('common');
    const dateLocale = locale === 'hy' ? hy : enUS;
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(() =>
      toDateString(defaultValue)
    );
    const currentValue = isControlled ? toDateString(value) : uncontrolledValue;
    const selectedDate = React.useMemo(() => parseValue(currentValue), [currentValue]);
    const [monthDate, setMonthDate] = React.useState<Date>(() => selectedDate ?? new Date());
    const [open, setOpen] = React.useState(false);
    const [yearDropdownOpen, setYearDropdownOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);
    const [popoverPosition, setPopoverPosition] = React.useState<PopoverPosition | null>(null);
    const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);
    const generatedId = React.useId();
    const triggerId = id ?? `date-picker-${generatedId}`;

    const emitChange = React.useCallback(
      (nextValue: string) => {
        if (!isControlled) {
          setUncontrolledValue(nextValue);
        }
        const event = {
          target: { name: name ?? '', value: nextValue },
          currentTarget: { name: name ?? '', value: nextValue },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(event);
        onValueChange?.(nextValue);
      },
      [isControlled, name, onChange, onValueChange]
    );

    const isOutOfRange = React.useCallback(
      (date: Date) => {
        const dateValue = format(date, 'yyyy-MM-dd');
        if (min && dateValue < min) return true;
        if (max && dateValue > max) return true;
        return false;
      },
      [max, min]
    );

    const updatePopoverPosition = React.useCallback(() => {
      const root = rootRef.current;
      const trigger = root?.querySelector<HTMLButtonElement>('[data-role="date-trigger"]');
      if (!root || !trigger) return;

      const portalTarget = resolvePortalContainer(root);
      const useDialogPortal = portalTarget !== document.body;
      setPortalContainer(portalTarget);

      const isDesktop = isDesktopViewport();
      const triggerRect = trigger.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const popoverWidth = isDesktop
        ? root.offsetWidth
        : Math.min(MOBILE_POPOVER_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);

      const anchorTop = isDesktop ? rootRect.top : triggerRect.top;
      const anchorBottom = isDesktop ? rootRect.bottom : triggerRect.bottom;
      const canOpenBelow =
        anchorBottom + ESTIMATED_POPOVER_HEIGHT <= window.innerHeight - VIEWPORT_PADDING;
      const placement: PopoverPosition['placement'] = canOpenBelow ? 'below' : 'above';

      if (useDialogPortal) {
        const dialogRect = portalTarget.getBoundingClientRect();
        let left = (isDesktop ? rootRect.left : triggerRect.left) - dialogRect.left;
        const maxLeft = portalTarget.clientWidth - popoverWidth - VIEWPORT_PADDING;
        left = Math.max(VIEWPORT_PADDING, Math.min(left, maxLeft));

        const top = canOpenBelow
          ? anchorBottom - dialogRect.top + VIEWPORT_PADDING
          : Math.max(
              VIEWPORT_PADDING,
              anchorTop - dialogRect.top - ESTIMATED_POPOVER_HEIGHT - VIEWPORT_PADDING
            );

        setPopoverPosition({
          left,
          top,
          width: popoverWidth,
          placement,
          matchFormWidth: isDesktop,
          positionMode: 'absolute',
        });
        return;
      }

      let left = isDesktop ? rootRect.left : triggerRect.left;
      if (left + popoverWidth > window.innerWidth - VIEWPORT_PADDING) {
        left = Math.max(VIEWPORT_PADDING, window.innerWidth - popoverWidth - VIEWPORT_PADDING);
      }
      if (left < VIEWPORT_PADDING) {
        left = VIEWPORT_PADDING;
      }

      const openBelowTop = anchorBottom + VIEWPORT_PADDING;
      const openAboveTop = anchorTop - ESTIMATED_POPOVER_HEIGHT - VIEWPORT_PADDING;
      const top = canOpenBelow ? openBelowTop : Math.max(VIEWPORT_PADDING, openAboveTop);

      setPopoverPosition({
        left,
        top,
        width: popoverWidth,
        placement,
        matchFormWidth: isDesktop,
        positionMode: 'fixed',
      });
    }, []);

    const handleOpenChange = React.useCallback(
      (nextOpen: boolean) => {
        if (!nextOpen) {
          setOpen(false);
          setPopoverPosition(null);
          setPortalContainer(null);
          setYearDropdownOpen(false);
          return;
        }
        updatePopoverPosition();
        setOpen(true);
      },
      [updatePopoverPosition]
    );

    const { minYear, maxYear } = React.useMemo(() => getYearBounds(min, max), [max, min]);
    const yearOptions = React.useMemo(
      () => buildYearList(minYear, maxYear),
      [maxYear, minYear]
    );

    React.useEffect(() => {
      setMounted(true);
    }, []);

    React.useEffect(() => {
      if (!selectedDate) return;
      setMonthDate(selectedDate);
    }, [selectedDate]);

    React.useEffect(() => {
      if (!open) return;

      const onOutsidePress = (event: MouseEvent | TouchEvent | PointerEvent) => {
        const target = event.target as Node;
        if (rootRef.current?.contains(target)) return;
        if (popoverRef.current?.contains(target)) return;
        if (yearDropdownOpen) {
          setYearDropdownOpen(false);
          return;
        }
        if (!isDesktopViewport()) {
          event.stopPropagation();
        }
        handleOpenChange(false);
      };

      const onEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          if (yearDropdownOpen) {
            setYearDropdownOpen(false);
            return;
          }
          handleOpenChange(false);
        }
      };

      updatePopoverPosition();
      document.addEventListener('pointerdown', onOutsidePress, { capture: true });
      document.addEventListener('keydown', onEscape);
      window.addEventListener('resize', updatePopoverPosition);
      window.addEventListener('scroll', updatePopoverPosition, true);

      return () => {
        document.removeEventListener('pointerdown', onOutsidePress, { capture: true });
        document.removeEventListener('keydown', onEscape);
        window.removeEventListener('resize', updatePopoverPosition);
        window.removeEventListener('scroll', updatePopoverPosition, true);
      };
    }, [handleOpenChange, open, updatePopoverPosition, yearDropdownOpen]);

    const monthName = format(monthDate, 'MMM', { locale: dateLocale });
    const visibleYear = monthDate.getFullYear();
    const days = React.useMemo(() => createCalendarDays(monthDate), [monthDate]);
    const displayValue = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : placeholder ?? '';

    const selectDate = (date: Date) => {
      if (isOutOfRange(date) || disabled) return;
      emitChange(format(date, 'yyyy-MM-dd'));
      handleOpenChange(false);
    };

    const handleClear = () => {
      emitChange('');
      handleOpenChange(false);
    };

    const handleToday = () => {
      const now = new Date();
      if (isOutOfRange(now) || disabled) return;
      setMonthDate(now);
      selectDate(now);
    };

    const handleYearToggle = React.useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setYearDropdownOpen((prev) => !prev);
    }, []);

    const isMobileLayout = open && popoverPosition ? !popoverPosition.matchFormWidth : false;

    const mobileBackdrop =
      isMobileLayout && open && portalContainer ? (
        <div
          className={cn('fixed inset-0 bg-transparent', MOBILE_CALENDAR_BACKDROP_Z_CLASS)}
          aria-hidden
          onPointerDown={(event) => {
            event.stopPropagation();
            if (yearDropdownOpen) {
              setYearDropdownOpen(false);
              return;
            }
            handleOpenChange(false);
          }}
        />
      ) : null;

    const calendarPopover =
      open && popoverPosition ? (
        <div
          ref={popoverRef}
          id={`${triggerId}-dialog`}
          role="dialog"
          aria-label={placeholder || tCommon('date')}
          onPointerDown={(event) => event.stopPropagation()}
          style={{
            position: popoverPosition.positionMode,
            left: popoverPosition.left,
            top: popoverPosition.top,
            width: popoverPosition.width,
            boxSizing: 'border-box',
          }}
          className={cn(
            MOBILE_CALENDAR_Z_CLASS,
            'relative overflow-visible max-w-[calc(100vw-1rem)] rounded-[1.25rem]',
            'border border-slate-200 bg-white p-2.5 shadow-[0_20px_48px_rgba(15,23,42,0.16)]'
          )}
        >
          <div className="relative mb-2 flex items-center justify-between gap-1">
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                setYearDropdownOpen(false);
                setMonthDate((prev) => addMonths(prev, -1));
              }}
              className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 min-[1367px]:h-8 min-[1367px]:w-8"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex min-w-0 items-center justify-center gap-1.5">
              <span className="truncate text-sm font-semibold capitalize text-slate-900 min-[1367px]:text-base">
                {monthName}
              </span>
              <button
                type="button"
                onPointerDown={handleYearToggle}
                className={cn(
                  'inline-flex shrink-0 touch-manipulation items-center gap-0.5 rounded-md px-2 py-1 text-sm font-semibold tabular-nums text-[#2d329f] hover:bg-slate-100 min-[1367px]:px-1.5 min-[1367px]:py-0.5 min-[1367px]:text-base',
                  yearDropdownOpen && 'bg-slate-100'
                )}
                aria-expanded={yearDropdownOpen}
                aria-haspopup="listbox"
              >
                {visibleYear}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform',
                    yearDropdownOpen && 'rotate-180'
                  )}
                />
              </button>
            </div>

            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                setYearDropdownOpen(false);
                setMonthDate((prev) => addMonths(prev, 1));
              }}
              className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 min-[1367px]:h-8 min-[1367px]:w-8"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {yearDropdownOpen ? (
            <div
              className={cn(
                'absolute z-30 rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]',
                isMobileLayout ? 'inset-x-1 top-10' : 'left-1/2 top-9 w-44 -translate-x-1/2'
              )}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <DatePickerYearDropdown
                years={yearOptions}
                selectedYear={visibleYear}
                compact={isMobileLayout}
                onSelectYear={(year) => {
                  setMonthDate((prev) => setYear(prev, year));
                  setYearDropdownOpen(false);
                }}
              />
            </div>
          ) : null}

          <div
            className="grid grid-cols-7 gap-y-0.5 pb-1 text-center text-[11px] font-semibold tracking-wide text-slate-500"
            onPointerDown={() => setYearDropdownOpen(false)}
          >
            {WEEKDAYS.map((weekday, index) => (
              <div key={weekday} className={cn((index === 5 || index === 6) && 'text-[#b06d6d]')}>
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5 text-center">
            {days.map((day) => {
              const inMonth = isSameMonth(day, monthDate);
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, new Date());
              const weekend = day.getDay() === 0 || day.getDay() === 6;
              const outOfRange = isOutOfRange(day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDate(day)}
                  disabled={outOfRange}
                  className={cn(
                    popoverPosition.matchFormWidth
                      ? 'flex aspect-square w-full max-h-8 items-center justify-center rounded-full text-[0.88rem] font-medium leading-none transition-colors'
                      : 'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[0.88rem] font-medium leading-none transition-colors',
                    selected && 'bg-[#2d329f] text-white',
                    !selected && isToday && 'rounded-md border border-[#3036b6]/45',
                    !selected && inMonth && 'text-slate-900 hover:bg-slate-100',
                    !selected && !inMonth && 'text-slate-300 hover:bg-slate-100',
                    !selected && weekend && inMonth && 'text-[#a56363]',
                    outOfRange && 'cursor-not-allowed opacity-35 hover:bg-transparent'
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
              onClick={handleClear}
              disabled={!allowClear || required}
              className="text-xs font-semibold text-[#3036b6] hover:underline disabled:opacity-40"
            >
              {tCommon('clear')}
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-semibold text-[#3036b6] hover:underline"
            >
              {tCommon('today')}
            </button>
          </div>
        </div>
      ) : null;

    return (
      <div ref={rootRef} className="relative w-full">
        <input
          {...rest}
          ref={ref}
          id={triggerId}
          name={name}
          value={currentValue}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          min={min}
          max={max}
          disabled={disabled}
          type="hidden"
        />
        <button
          type="button"
          data-role="date-trigger"
          onClick={() => !disabled && handleOpenChange(!open)}
          className={cn(
            'h-10 w-full rounded-lg border border-slate-300 px-3 text-left text-[16px] transition-colors lg:text-sm',
            'focus:outline-none focus:ring-2 focus:ring-[#3036b6]/25',
            selectedDate ? 'text-slate-900' : 'text-slate-400',
            disabled && 'cursor-not-allowed opacity-60',
            className
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${triggerId}-dialog`}
          disabled={disabled}
        >
          {displayValue || placeholder || ''}
        </button>

        {mounted && mobileBackdrop && portalContainer
          ? createPortal(mobileBackdrop, portalContainer)
          : null}
        {mounted && calendarPopover && portalContainer
          ? createPortal(calendarPopover, portalContainer)
          : null}
      </div>
    );
  }
);

DatePickerInput.displayName = 'DatePickerInput';
