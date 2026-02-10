'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, KeyboardEvent } from 'react';
import { locales, Locale } from '@/config/i18n';

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
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, targetLocale: Locale) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (locale !== targetLocale) {
        switchLocale(targetLocale);
      }
    }
  };

  const isHyActive = locale === 'hy';
  const isEnActive = locale === 'en';

  return (
    <div
      className="inline-flex items-center gap-3"
      aria-label={t('ariaLabel', { default: 'Language selector' })}
    >
      {/* Segmented control container */}
      <div
        className="relative inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-500 border border-slate-200"
        role="radiogroup"
        aria-label={t('ariaLabel', { default: 'Language' })}
      >
        {/* Active background pill */}
        <div
          className={`absolute inset-y-1 w-1/2 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
            isHyActive ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-hidden="true"
        />

        {/* HY */}
        <div
          role="radio"
          tabIndex={isHyActive ? 0 : -1}
          aria-checked={isHyActive}
          onClick={() => !isHyActive && switchLocale('hy')}
          onKeyDown={(event) => handleKeyDown(event, 'hy')}
          className={`relative z-10 flex items-center justify-center px-3 py-1.5 rounded-full cursor-pointer transition-colors duration-200 ${
            isHyActive ? 'text-slate-900' : 'text-slate-500'
          }`}
        >
          <span className="mx-1.5">Հայերեն</span>
        </div>

        {/* EN */}
        <div
          role="radio"
          tabIndex={isEnActive ? 0 : -1}
          aria-checked={isEnActive}
          onClick={() => !isEnActive && switchLocale('en')}
          onKeyDown={(event) => handleKeyDown(event, 'en')}
          className={`relative z-10 flex items-center justify-center px-3 py-1.5 rounded-full cursor-pointer transition-colors duration-200 ${
            isEnActive ? 'text-slate-900' : 'text-slate-500'
          }`}
        >
          <span className="mx-1.5">English</span>
        </div>
      </div>
    </div>
  );
}