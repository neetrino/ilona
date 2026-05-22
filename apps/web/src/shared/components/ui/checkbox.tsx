'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  indeterminate = false,
  onCheckedChange,
  disabled = false,
  className,
}: CheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      className={cn(
        'h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#1010a3]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:ring-2 focus:ring-[#1010a3]/30 focus:ring-offset-2',
        className
      )}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
    />
  );
}

















