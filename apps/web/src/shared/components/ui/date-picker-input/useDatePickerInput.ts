'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { enGB, hy } from 'date-fns/locale';
import { computePopoverPosition } from './date-picker-popover-position.util';
import type { DatePickerInputProps, DatePickerInputViewModel } from './date-picker-input.types';
import {
  buildYearList,
  createCalendarDays,
  getYearBounds,
  isDatePickerEventTarget,
  isDesktopViewport,
  parseManualDate,
  parseValue,
  toDateString,
} from './date-picker-input.util';

export function useDatePickerInput({
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
  popoverExpanded = false,
}: DatePickerInputProps): DatePickerInputViewModel {
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const dateLocale = locale === 'hy' ? hy : enGB;
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(() =>
    toDateString(defaultValue),
  );
  const currentValue = isControlled ? toDateString(value) : uncontrolledValue;
  const selectedDate = React.useMemo(() => parseValue(currentValue), [currentValue]);
  const [monthDate, setMonthDate] = React.useState<Date>(() => selectedDate ?? new Date());
  const [open, setOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftText, setDraftText] = React.useState('');
  const [yearDropdownOpen, setYearDropdownOpen] = React.useState(false);
  const yearDropdownOpenRef = React.useRef(false);
  const [mounted, setMounted] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = React.useState<
    DatePickerInputViewModel['popoverPosition']
  >(null);
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
    [isControlled, name, onChange, onValueChange],
  );

  const isOutOfRange = React.useCallback(
    (date: Date) => {
      const dateValue = format(date, 'yyyy-MM-dd');
      if (min && dateValue < min) return true;
      if (max && dateValue > max) return true;
      return false;
    },
    [max, min],
  );

  const updatePopoverPosition = React.useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const result = computePopoverPosition({
      root,
      popoverElement: popoverRef.current,
      popoverExpanded,
    });
    if (!result) return;

    setPortalContainer(result.portalContainer);
    setPopoverPosition(result.position);
  }, [popoverExpanded]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setOpen(false);
        setPopoverPosition(null);
        setPortalContainer(null);
        setYearDropdownOpen(false);
        return;
      }
      if (!isDesktopViewport()) {
        rootRef.current
          ?.querySelector<HTMLInputElement>('[data-role="date-trigger"]')
          ?.blur();
      }
      updatePopoverPosition();
      setOpen(true);
    },
    [updatePopoverPosition],
  );

  React.useLayoutEffect(() => {
    if (!open || !popoverRef.current) return;
    updatePopoverPosition();
  }, [open, updatePopoverPosition]);

  const { minYear, maxYear } = React.useMemo(() => getYearBounds(min, max), [max, min]);
  const yearOptions = React.useMemo(
    () => buildYearList(minYear, maxYear),
    [maxYear, minYear],
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!selectedDate) return;
    setMonthDate(selectedDate);
  }, [selectedDate]);

  yearDropdownOpenRef.current = yearDropdownOpen;

  React.useEffect(() => {
    if (!open) return;

    const isInsideDatePicker = (target: Node): boolean => {
      if (rootRef.current?.contains(target)) return true;
      if (popoverRef.current?.contains(target)) return true;
      return isDatePickerEventTarget(target);
    };

    const onOutsidePress = (event: MouseEvent | TouchEvent | PointerEvent) => {
      const target = event.target as Node;
      if (isInsideDatePicker(target)) return;
      if (yearDropdownOpenRef.current) {
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
        if (yearDropdownOpenRef.current) {
          setYearDropdownOpen(false);
          return;
        }
        handleOpenChange(false);
      }
    };

    updatePopoverPosition();
    const timeoutId = window.setTimeout(() => {
      document.addEventListener('pointerdown', onOutsidePress, { capture: true });
    }, 0);
    document.addEventListener('keydown', onEscape);
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('pointerdown', onOutsidePress, { capture: true });
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [handleOpenChange, open, updatePopoverPosition]);

  const monthName = format(monthDate, 'MMM', { locale: dateLocale });
  const visibleYear = monthDate.getFullYear();
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

  const handleYearToggle = React.useCallback(() => {
    setYearDropdownOpen((prev) => !prev);
  }, []);

  const isMobileLayout = open && popoverPosition ? !popoverPosition.matchFormWidth : false;
  const useDialogPortal = portalContainer !== null && portalContainer !== document.body;
  const backdropPositionClass = useDialogPortal ? 'absolute' : 'fixed';

  return {
    rootRef,
    popoverRef,
    triggerId,
    open,
    mounted,
    currentValue,
    inputValue,
    selectedDate,
    monthDate,
    setMonthDate,
    yearDropdownOpen,
    setYearDropdownOpen,
    yearDropdownOpenRef,
    yearOptions,
    visibleYear,
    monthName,
    days,
    popoverPosition,
    portalContainer,
    isMobileLayout,
    useDialogPortal,
    backdropPositionClass,
    allowClear,
    required,
    disabled,
    placeholder,
    className,
    name,
    min,
    max,
    onChange,
    handleOpenChange,
    handleYearToggle,
    isOutOfRange,
    selectDate,
    handleClear,
    handleToday,
    setDraftText,
    handleInputFocus,
    handleInputBlur,
    handleInputKeyDown,
    isEditing,
    tCommon,
  };
}
