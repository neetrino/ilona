'use client';

import { useEffect } from 'react';
import { Locale } from '@/config/i18n';

interface SetLangAttributeProps {
  locale: Locale;
}

export function SetLangAttribute({ locale }: SetLangAttributeProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}











