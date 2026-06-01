'use client';

import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { type Locale } from '@/config/i18n';
import { usePathname, useRouter } from '@/config/navigation';

const LOCALE_STORAGE_KEY = 'preferred-locale';

export function useSwitchLocale() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) {
      return;
    }

    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);

    const queryString = searchParams.toString();
    const href = queryString ? `${pathname}?${queryString}` : pathname;

    router.replace(href, { locale: newLocale });
  };

  return { locale, switchLocale };
}
