'use client';

import { useLocale } from 'next-intl';
import { type Locale } from '@/config/i18n';
import { useLocaleSwitchContext } from '@/shared/providers/ClientIntlProvider';

export function useSwitchLocale() {
  const locale = useLocale() as Locale;
  const { switchLocale } = useLocaleSwitchContext();

  return { locale, switchLocale };
}
