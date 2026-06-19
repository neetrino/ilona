import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'hy'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Required by next-intl during static generation (avoids ENVIRONMENT_FALLBACK build logs). */
export const appTimeZone = 'Asia/Yerevan';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    timeZone: appTimeZone,
    messages: (await import(`../../languages/${locale}.json`)).default,
  };
});
