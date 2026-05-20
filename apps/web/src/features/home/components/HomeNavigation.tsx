'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { homeBrandFont } from './home-navigation.font';

type NavItemKey =
  | 'navHome'
  | 'navAbout'
  | 'navCourses'
  | 'navTeachers'
  | 'navBranches'
  | 'navContact'
  | 'navBlog';

interface NavItem {
  key: NavItemKey;
  hash: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'navHome', hash: '' },
  { key: 'navAbout', hash: '#about' },
  { key: 'navCourses', hash: '#courses' },
  { key: 'navTeachers', hash: '#teachers' },
  { key: 'navBranches', hash: '#branches' },
  { key: 'navContact', hash: '#contact' },
  { key: 'navBlog', hash: '#blog' },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-6 w-6 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}

export function HomeNavigation() {
  const t = useTranslations('home');
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);

  const homeBase = `/home/${locale}`;
  const registerHref = `/${locale}/register`;

  const navHref = useCallback(
    (hash: string) => (hash ? `${homeBase}${hash}` : homeBase),
    [homeBase],
  );

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
      <nav
        className="relative mx-auto w-full max-w-[1600px] rounded-full border-b border-[#e5e7eb] bg-[#093394] shadow-sm"
        aria-label={t('navAriaLabel')}
      >
        <div className="flex min-h-[4.375rem] items-center justify-between gap-3 px-4 py-2.5 sm:px-5 md:px-6 lg:min-h-[4.625rem]">
          <Link
            href={homeBase}
            className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
            onClick={closeMobile}
          >
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full sm:h-[3.25rem] sm:w-[3.25rem]">
              <Image
                src="/home-nav-logo.png"
                alt=""
                width={52}
                height={53}
                className="h-full w-full object-cover"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/logo.png';
                  target.onerror = null;
                }}
              />
            </span>
            <span
              className={cn(
                homeBrandFont.className,
                'truncate text-base font-bold leading-tight tracking-[-0.01em] text-white sm:text-lg',
              )}
            >
              {t('title')}
            </span>
          </Link>

          <ul className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 xl:flex xl:gap-8">
            {NAV_ITEMS.map(({ key, hash }) => (
              <li key={key}>
                <Link
                  href={navHref(hash)}
                  className="whitespace-nowrap text-base font-normal tracking-[-0.02em] text-white transition-opacity hover:opacity-85"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex rounded-full p-2 transition-colors hover:bg-white/10 xl:hidden"
              aria-expanded={mobileOpen}
              aria-controls="home-mobile-nav"
              aria-label={mobileOpen ? t('navCloseMenu') : t('navOpenMenu')}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <MenuIcon open={mobileOpen} />
            </button>

            <Link
              href={registerHref}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#e7000b] px-4 text-sm font-bold tracking-[-0.02em] text-white transition-colors hover:bg-[#c40009] sm:h-12 sm:px-6 sm:text-base"
            >
              <span className="whitespace-nowrap">{t('registerNow')}</span>
            </Link>
          </div>
        </div>

        <div
          id="home-mobile-nav"
          className={cn(
            'overflow-hidden border-t border-white/15 xl:hidden',
            mobileOpen ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <ul className="flex flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_ITEMS.map(({ key, hash }) => (
              <li key={key}>
                <Link
                  href={navHref(hash)}
                  className="block rounded-lg px-3 py-2.5 text-base text-white transition-colors hover:bg-white/10"
                  onClick={closeMobile}
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
