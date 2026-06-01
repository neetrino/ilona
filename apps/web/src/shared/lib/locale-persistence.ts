import { type Locale } from '@/config/i18n';

export const LOCALE_STORAGE_KEY = 'preferred-locale';
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function persistLocalePreference(newLocale: Locale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);

  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';

  document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}
