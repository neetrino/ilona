'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';
import { MOBILE_CALENDAR_BACKDROP_Z_CLASS } from './date-picker-input/date-picker-input.constants';
import { useDatePickerInput } from './date-picker-input/useDatePickerInput';
import { DatePickerCalendarPopover } from './date-picker-input/DatePickerCalendarPopover';
import { DatePickerInputTrigger } from './date-picker-input/DatePickerInputTrigger';

export { DATE_PICKER_POPOVER_ATTR } from './date-picker-input/date-picker-input.constants';
export type { DatePickerInputProps } from './date-picker-input/date-picker-input.types';

export const DatePickerInput = React.forwardRef<
  HTMLInputElement,
  import('./date-picker-input/date-picker-input.types').DatePickerInputProps
>(function DatePickerInput(props, ref) {
  const {
    id: _id,
    name: _name,
    value: _value,
    defaultValue: _defaultValue,
    onChange: _onChange,
    onValueChange: _onValueChange,
    onBlur: _onBlur,
    min: _min,
    max: _max,
    disabled: _disabled,
    required: _required,
    className: _className,
    placeholder: _placeholder,
    allowClear: _allowClear,
    popoverExpanded: _popoverExpanded,
    ...rest
  } = props;
  const vm = useDatePickerInput(props);

  const mobileBackdrop =
    vm.isMobileLayout && vm.open && vm.portalContainer ? (
      <div
        className={cn(
          vm.backdropPositionClass,
          'inset-0 bg-transparent',
          MOBILE_CALENDAR_BACKDROP_Z_CLASS,
        )}
        aria-hidden
        onPointerDown={(event) => {
          event.stopPropagation();
          if (vm.yearDropdownOpenRef.current) {
            vm.setYearDropdownOpen(false);
            return;
          }
          vm.handleOpenChange(false);
        }}
      />
    ) : null;

  return (
    <div ref={vm.rootRef} className={cn('relative w-full', vm.open && 'z-[10001]')}>
      <input
        name={vm.name}
        value={vm.currentValue}
        onChange={vm.onChange}
        required={vm.required}
        min={typeof vm.min === 'string' || typeof vm.min === 'number' ? vm.min : undefined}
        max={typeof vm.max === 'string' || typeof vm.max === 'number' ? vm.max : undefined}
        disabled={vm.disabled}
        type="hidden"
        tabIndex={-1}
        aria-hidden
      />
      <DatePickerInputTrigger vm={vm} inputRef={ref} {...rest} />
      {vm.mounted && mobileBackdrop && vm.portalContainer
        ? createPortal(mobileBackdrop, vm.portalContainer)
        : null}
      {vm.mounted && vm.open && vm.popoverPosition && vm.portalContainer
        ? createPortal(<DatePickerCalendarPopover vm={vm} />, vm.portalContainer)
        : null}
    </div>
  );
});

DatePickerInput.displayName = 'DatePickerInput';
