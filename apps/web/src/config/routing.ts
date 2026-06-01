import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from '@/config/i18n';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'never',
  localeDetection: true,
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
});
