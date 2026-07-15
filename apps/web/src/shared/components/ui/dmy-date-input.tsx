'use client';

import { useLayoutEffect, useRef } from 'react';
import { applyDmyInputChange } from '@/shared/lib/dmy-date';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const caret = pendingCaretRef.current;
    if (!input || caret === null) return;
    input.setSelectionRange(caret, caret);
    pendingCaretRef.current = null;
  }, [value]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={(event) => {
        const { value: next, caret } = applyDmyInputChange(
          event.target.value,
          value,
          event.target.selectionStart,
        );
        pendingCaretRef.current = caret;
        onChange(next);
      }}
      className={cn(className)}
      disabled={disabled}
    />
  );
}
