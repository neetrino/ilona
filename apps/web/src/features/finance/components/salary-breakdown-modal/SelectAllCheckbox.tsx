'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { SelectAllCheckboxProps } from './salary-breakdown-modal.types';

export function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: SelectAllCheckboxProps) {
  const tCommon = useTranslations('common');
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
      className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label={tCommon('selectAll')}
    />
  );
}
