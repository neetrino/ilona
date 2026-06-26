'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('common');
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
      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#1010a3] disabled:cursor-not-allowed disabled:opacity-50"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label={t('selectAll')}
    />
  );
}


