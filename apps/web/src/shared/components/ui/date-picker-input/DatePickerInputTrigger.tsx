'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { isDesktopViewport } from './date-picker-input.util';
import type { DatePickerInputViewModel } from './date-picker-input.types';

interface DatePickerInputTriggerProps {
  vm: DatePickerInputViewModel;
  inputRef: React.Ref<HTMLInputElement>;
}

export function DatePickerInputTrigger({
  vm,
  inputRef,
  ...rest
}: DatePickerInputTriggerProps & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange' | 'value' | 'defaultValue' | 'id' | 'name' | 'min' | 'max' | 'disabled' | 'required' | 'placeholder' | 'className' | 'onBlur'
>) {
  return (
    <div className="relative w-full" data-date-anchor>
      <input
        {...rest}
        ref={inputRef}
        id={vm.triggerId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        data-role="date-trigger"
        value={vm.inputValue}
        onChange={(event) => vm.handleDraftTextChange(event.target.value)}
        onFocus={vm.handleInputFocus}
        onBlur={vm.handleInputBlur}
        onKeyDown={vm.handleInputKeyDown}
        onPointerDown={(event) => {
          if (vm.disabled || isDesktopViewport()) return;
          event.preventDefault();
          if (vm.open) return;
          vm.handleOpenChange(true);
        }}
        placeholder={vm.placeholder ?? 'DD/MM/YYYY'}
        disabled={vm.disabled}
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={vm.open}
        aria-controls={`${vm.triggerId}-dialog`}
        className={cn(
          'h-11 min-h-11 w-full rounded-[15px] border border-slate-300 py-0 pl-3 pr-10 text-[16px] transition-colors lg:text-sm',
          'focus:outline-none focus:ring-2 focus:ring-[#3036b6]/25',
          vm.selectedDate || vm.isEditing ? 'text-slate-900' : 'text-slate-400',
          vm.disabled && 'cursor-not-allowed opacity-60',
          vm.className,
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => !vm.disabled && vm.handleOpenChange(!vm.open)}
        className={cn(
          'absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500',
          'hover:bg-slate-100 hover:text-slate-700',
          vm.disabled && 'pointer-events-none opacity-60',
        )}
        aria-label={vm.placeholder || vm.tCommon('date')}
        disabled={vm.disabled}
      >
        <CalendarDays className="h-4 w-4" />
      </button>
    </div>
  );
}
