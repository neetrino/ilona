'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { locales, Locale, defaultLocale } from '@/config/i18n';

const LOCALE_STORAGE_KEY = 'preferred-locale';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('language');

  // Save current locale to localStorage when it changes
  useEffect(() => {
    if (locale && locales.includes(locale as Locale)) {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  }, [locale]);

  const switchLocale = (newLocale: Locale) => {
    // Save preference to localStorage
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    
    // Replace the locale in the current pathname
    const segments = pathname.split('/');
    if (segments[1] && locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join('/');
    router.push(newPath);
    router.refresh();
  };

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value as Locale)}
      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
      aria-label="Select language"
    >
      <option value="en">{t('english')}</option>
      <option value="hy">{t('armenian')}</option>
    </select>
  );
}

