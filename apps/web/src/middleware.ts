import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, Locale } from './config/i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

function isValidLocale(segment: string | undefined): segment is Locale {
  return segment !== undefined && locales.includes(segment as Locale);
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/home/${defaultLocale}`;
    return NextResponse.redirect(url);
  }

  if (pathname === '/home' || pathname === '/home/') {
    const url = request.nextUrl.clone();
    url.pathname = `/home/${defaultLocale}`;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/home/')) {
    const locale = pathname.split('/')[2];
    if (!isValidLocale(locale)) {
      const url = request.nextUrl.clone();
      url.pathname = `/home/${defaultLocale}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === `/${defaultLocale}` || pathname === '/hy') {
    const url = request.nextUrl.clone();
    url.pathname = `/home${pathname}`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
