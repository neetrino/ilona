'use client';

import { formatDmyInputValue } from '@/shared/lib/dmy-date';
import { cn } from '@/shared/lib/utils';

export interface DmyDateInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
}

export function DmyDateInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  autoComplete,
}: DmyDateInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(formatDmyInputValue(event.target.value))}
      className={cn(className)}
      disabled={disabled}
    />
  );
}
