'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { enGB, hy } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

interface PopoverPosition {
  left: number;
  top: number;
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

const MANUAL_DATE_FORMATS = ['dd/MM/yyyy', 'd/M/yyyy', 'dd/MM/yy', 'd/M/yy', 'yyyy-MM-dd'] as const;

function parseManualDate(text: string): Date | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  for (const dateFormat of MANUAL_DATE_FORMATS) {
    const parsed = parse(trimmed, dateFormat, new Date());
    if (isValid(parsed)) return parsed;
  }

  const iso = parseISO(trimmed);
  return Number.isNaN(iso.getTime()) ? null : iso;
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
    const dateLocale = locale === 'hy' ? hy : enGB;
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(() =>
      toDateString(defaultValue)
    );
    const currentValue = isControlled ? toDateString(value) : uncontrolledValue;
    const selectedDate = React.useMemo(() => parseValue(currentValue), [currentValue]);
    const [monthDate, setMonthDate] = React.useState<Date>(() => selectedDate ?? new Date());
    const [open, setOpen] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [draftText, setDraftText] = React.useState('');
    const rootRef = React.useRef<HTMLDivElement>(null);
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
      const trigger = rootRef.current?.querySelector<HTMLElement>('[data-role="date-trigger"]');
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 8;
      const estimatedPopoverHeight = 390;
      const popoverWidth = Math.min(264, window.innerWidth - viewportPadding * 2);

      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - viewportPadding) {
        left = window.innerWidth - popoverWidth - viewportPadding;
      }
      if (left < viewportPadding) {
        left = viewportPadding;
      }

      const openBelowTop = rect.bottom + viewportPadding;
      const canOpenBelow = openBelowTop + estimatedPopoverHeight <= window.innerHeight - viewportPadding;
      const openAboveTop = rect.top - estimatedPopoverHeight - viewportPadding;
      const top = canOpenBelow ? openBelowTop : Math.max(viewportPadding, openAboveTop);

      setPopoverPosition({ left, top });
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
      if (!selectedDate) return;
      setMonthDate(selectedDate);
    }, [selectedDate]);

    useOutsidePress(rootRef, () => handleOpenChange(false), { enabled: open });

    React.useEffect(() => {
      if (!open) return;
      const onEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') handleOpenChange(false);
      };

      updatePopoverPosition();
      document.addEventListener('keydown', onEscape);
      window.addEventListener('resize', updatePopoverPosition);
      window.addEventListener('scroll', updatePopoverPosition, true);

      return () => {
        document.removeEventListener('keydown', onEscape);
        window.removeEventListener('resize', updatePopoverPosition);
        window.removeEventListener('scroll', updatePopoverPosition, true);
      };
    }, [handleOpenChange, open, updatePopoverPosition]);

    const monthLabel = format(monthDate, 'MMMM yyyy', { locale: dateLocale });
    const days = React.useMemo(() => createCalendarDays(monthDate), [monthDate]);
    const displayValue = selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '';
    const inputValue = isEditing ? draftText : displayValue;

    const commitDraftText = React.useCallback(() => {
      const trimmed = draftText.trim();
      if (!trimmed) {
        if (allowClear && !required) {
          emitChange('');
        }
        return;
      }

      const parsed = parseManualDate(trimmed);
      if (!parsed) return;

      if (isOutOfRange(parsed) || disabled) return;

      emitChange(format(parsed, 'yyyy-MM-dd'));
      setMonthDate(parsed);
    }, [allowClear, disabled, draftText, emitChange, isOutOfRange, required]);

    const handleInputFocus = () => {
      setDraftText(displayValue);
      setIsEditing(true);
    };

    const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(false);
      commitDraftText();
      onBlur?.(event);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        setIsEditing(false);
        commitDraftText();
        handleOpenChange(false);
      }
      if (event.key === 'Escape') {
        setIsEditing(false);
        setDraftText(displayValue);
        handleOpenChange(false);
      }
    };

    const selectDate = (date: Date) => {
      if (isOutOfRange(date) || disabled) return;
      setIsEditing(false);
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

    return (
      <div ref={rootRef} className="relative w-full">
        <input
          name={name}
          value={currentValue}
          onChange={onChange}
          required={required}
          min={min}
          max={max}
          disabled={disabled}
          type="hidden"
          tabIndex={-1}
          aria-hidden
        />
        <div className="relative w-full">
          <input
            {...rest}
            ref={ref}
            id={triggerId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            data-role="date-trigger"
            value={inputValue}
            onChange={(event) => setDraftText(event.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder ?? 'DD/MM/YYYY'}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={`${triggerId}-dialog`}
            className={cn(
              'h-10 w-full rounded-lg border border-slate-300 py-2 pl-3 pr-10 text-[16px] transition-colors lg:text-sm',
              'focus:outline-none focus:ring-2 focus:ring-[#3036b6]/25',
              selectedDate || isEditing ? 'text-slate-900' : 'text-slate-400',
              disabled && 'cursor-not-allowed opacity-60',
              className
            )}
          />
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => !disabled && handleOpenChange(!open)}
            className={cn(
              'absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500',
              'hover:bg-slate-100 hover:text-slate-700',
              disabled && 'pointer-events-none opacity-60'
            )}
            aria-label={placeholder || tCommon('date')}
            disabled={disabled}
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>

        {open && popoverPosition ? (
          <div
            id={`${triggerId}-dialog`}
            role="dialog"
            aria-label={placeholder || tCommon('date')}
            style={{ left: popoverPosition.left, top: popoverPosition.top }}
            className={cn(
              'fixed z-50 w-[16.5rem] max-w-[calc(100vw-1rem)] rounded-[1.25rem]',
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
                      'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[0.88rem] font-medium leading-none transition-colors',
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
        ) : null}
      </div>
    );
  }
);

DatePickerInput.displayName = 'DatePickerInput';
