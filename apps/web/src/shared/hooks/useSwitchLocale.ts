'use client';

import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { type Locale } from '@/config/i18n';
import { usePathname } from '@/config/navigation';

const LOCALE_STORAGE_KEY = 'preferred-locale';
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function setLocaleCookie(newLocale: Locale) {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';

  document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

export function useSwitchLocale() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) {
      return;
    }

    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    setLocaleCookie(newLocale);

    const queryString = searchParams.toString();
    const path = pathname || '/';
    const href = queryString ? `${path}?${queryString}` : path;

    // Full navigation avoids Vercel / Router Cache serving stale RSC for the same URL
    // when localePrefix is "never" (path does not change on locale switch).
    window.location.assign(href);
  };

  return { locale, switchLocale };
}
