'use client';

import { useEffect, useRef } from 'react';

interface SelectAllCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: SelectAllCheckboxProps) {
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
      className="h-4 w-4 cursor-pointer rounded border-[rgba(14,14,16,0.12)] accent-[#1010a3] disabled:cursor-not-allowed disabled:opacity-50"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label="Select all"
    />
  );
}

