import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './config/i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files
  // - Internal Next.js paths
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};


