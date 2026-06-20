'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, addMonths, format, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { enUS, hy } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const DESKTOP_MIN_WIDTH = 1367;
const MOBILE_POPOVER_WIDTH = 264;
const ESTIMATED_POPOVER_HEIGHT = 390;
const VIEWPORT_PADDING = 8;

interface PopoverPosition {
  left: number;
  top: number;
  width: number;
  placement: 'above' | 'below';
  matchFormWidth: boolean;
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
    const [mounted, setMounted] = React.useState(false);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);
    const [popoverPosition, setPopoverPosition] = React.useState<PopoverPosition | null>(null);
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

      const isDesktop = isDesktopViewport();
      const triggerRect = trigger.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const popoverWidth = isDesktop
        ? root.offsetWidth
        : Math.min(MOBILE_POPOVER_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);

      let left = isDesktop ? rootRect.left : triggerRect.left;
      if (left + popoverWidth > window.innerWidth - VIEWPORT_PADDING) {
        left = Math.max(VIEWPORT_PADDING, window.innerWidth - popoverWidth - VIEWPORT_PADDING);
      }
      if (left < VIEWPORT_PADDING) {
        left = VIEWPORT_PADDING;
      }

      const anchorTop = isDesktop ? rootRect.top : triggerRect.top;
      const anchorBottom = isDesktop ? rootRect.bottom : triggerRect.bottom;
      const openBelowTop = anchorBottom + VIEWPORT_PADDING;
      const canOpenBelow =
        openBelowTop + ESTIMATED_POPOVER_HEIGHT <= window.innerHeight - VIEWPORT_PADDING;
      const openAboveTop = anchorTop - ESTIMATED_POPOVER_HEIGHT - VIEWPORT_PADDING;
      const placement: PopoverPosition['placement'] = canOpenBelow ? 'below' : 'above';
      const top = canOpenBelow ? openBelowTop : Math.max(VIEWPORT_PADDING, openAboveTop);

      setPopoverPosition({ left, top, width: popoverWidth, placement, matchFormWidth: isDesktop });
    }, []);

    const handleOpenChange = React.useCallback(
      (nextOpen: boolean) => {
        if (!nextOpen) {
          setOpen(false);
          setPopoverPosition(null);
          return;
        }
        updatePopoverPosition();
        setOpen(true);
      },
      [updatePopoverPosition]
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
        if (!isDesktopViewport()) return;

        const target = event.target as Node;
        if (rootRef.current?.contains(target)) return;
        if (popoverRef.current?.contains(target)) return;
        handleOpenChange(false);
      };

      const onEscape = (event: KeyboardEvent) => {
        if (!isDesktopViewport()) return;
        if (event.key === 'Escape') handleOpenChange(false);
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
    }, [handleOpenChange, open, updatePopoverPosition]);

    const monthLabel = format(monthDate, 'MMMM yyyy', { locale: dateLocale });
    const days = React.useMemo(() => createCalendarDays(monthDate), [monthDate]);
    const displayValue = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : placeholder ?? '';

    const selectDate = (date: Date) => {
      if (isOutOfRange(date) || disabled) return;
      emitChange(format(date, 'yyyy-MM-dd'));
      setOpen(false);
    };

    const handleClear = () => {
      emitChange('');
      setOpen(false);
    };

    const handleToday = () => {
      const now = new Date();
      if (isOutOfRange(now) || disabled) return;
      setMonthDate(now);
      selectDate(now);
    };

    const calendarPopover =
      open && popoverPosition ? (
        <div
          ref={popoverRef}
          id={`${triggerId}-dialog`}
          role="dialog"
          aria-label={placeholder || tCommon('date')}
          style={{
            left: popoverPosition.left,
            top: popoverPosition.top,
            width: popoverPosition.width,
            boxSizing: 'border-box',
          }}
          className={cn(
            'fixed z-[100] max-w-[calc(100vw-1rem)] rounded-[1.25rem]',
            'border border-slate-200 bg-white p-2.5 shadow-[0_20px_48px_rgba(15,23,42,0.16)]'
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonthDate((prev) => addMonths(prev, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-base font-semibold capitalize text-slate-900">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setMonthDate((prev) => addMonths(prev, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-0.5 pb-1 text-center text-[11px] font-semibold tracking-wide text-slate-500">
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

        {mounted && calendarPopover ? createPortal(calendarPopover, document.body) : null}
      </div>
    );
  }
);

DatePickerInput.displayName = 'DatePickerInput';
