'use client';

import type { ReactNode, InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';
import { studentLabelClass, studentInputClass } from './tokens';
import { DatePickerInput } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import type { DatePickerInputProps } from '@/shared/components/ui/date-picker-input';

export function StudentFieldLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn(studentLabelClass, className)}>
      {children}
    </label>
  );
}

export function StudentInput({
  type,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  if (type === 'date') {
    return <StudentDatePicker className={className} {...props} />;
  }
  return <input className={cn(studentInputClass, className)} {...props} />;
}

export function StudentDatePicker({
  className,
  ...props
}: Omit<DatePickerInputProps, 'popoverExpanded'>) {
  return (
    <DatePickerInput
      popoverExpanded
      className={cn(studentInputClass, className)}
      {...props}
    />
  );
}

export type StudentSelectOption = {
  value: string;
  label: string;
};

export type StudentSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: StudentSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
  isLoading?: boolean;
};

export function StudentSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className,
  allowClear = false,
  isLoading = false,
}: StudentSelectProps) {
  return (
    <SingleSelectDropdown
      id={id}
      options={options.map((option) => ({ id: option.value, label: option.label }))}
      value={value || null}
      onValueChange={(next) => onChange(next ?? '')}
      placeholder={placeholder}
      disabled={disabled}
      isLoading={isLoading}
      allowDeselect={allowClear}
      className={className}
    />
  );
}

export function StudentFilterGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:items-end',
        className,
      )}
    >
      {children}
    </div>
  );
}
