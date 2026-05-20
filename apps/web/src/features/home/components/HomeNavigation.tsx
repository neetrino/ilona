'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { homeBrandFont } from './home-navigation.font';
import { HOME_NAV_ITEMS } from './home-navigation.types';
import { HomeNavigationMobileMenu } from './HomeNavigationMobileMenu';
import { useHomeMobileNav } from './use-home-mobile-nav';
import { HomeShell, HOME_SHELL_INNER_X_CLASS } from './home-shell';

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

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);

  useHomeMobileNav(mobileOpen, closeMobile);

  return (
    <header className="sticky top-0 z-50 bg-white">
      <HomeShell className="relative py-2 sm:py-3">
        <nav
          className="relative rounded-full border-b border-[#e5e7eb] bg-[#093394] shadow-sm"
          aria-label={t('navAriaLabel')}
        >
          <div
            className={cn(
              HOME_SHELL_INNER_X_CLASS,
              'flex min-h-14 items-center justify-between gap-2 py-2 sm:min-h-[4.375rem] sm:gap-3 lg:min-h-[4.625rem]',
            )}
          >
            <Link
              href={homeBase}
              className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-[55%] sm:gap-3 lg:max-w-none lg:flex-none"
              onClick={closeMobile}
            >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full sm:h-11 sm:w-11 md:h-[3.25rem] md:w-[3.25rem]">
                <Image
                  src="/home-nav-logo.png"
                  alt=""
                  width={52}
                  height={53}
                  sizes="(max-width: 640px) 40px, 52px"
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
                  'hidden min-w-0 truncate text-sm font-bold leading-tight tracking-[-0.01em] text-white min-[400px]:block sm:text-base md:text-lg',
                )}
              >
                {t('title')}
              </span>
            </Link>

            <ul className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-5 xl:flex 2xl:gap-8">
              {HOME_NAV_ITEMS.map(({ key, hash }) => (
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

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white xl:hidden"
                aria-expanded={mobileOpen}
                aria-controls="home-mobile-nav"
                aria-label={mobileOpen ? t('navCloseMenu') : t('navOpenMenu')}
                onClick={toggleMobile}
              >
                <MenuIcon open={mobileOpen} />
              </button>

              <Link
                href={registerHref}
                className="inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-full bg-[#e7000b] px-3 text-sm font-bold tracking-[-0.02em] text-white transition-colors hover:bg-[#c40009] active:bg-[#a30008] sm:px-5 sm:text-base md:h-12 md:px-6 xl:min-w-0"
              >
                <span className="whitespace-nowrap sm:hidden">{t('registerNowShort')}</span>
                <span className="hidden whitespace-nowrap sm:inline">{t('registerNow')}</span>
              </Link>
            </div>
          </div>
        </nav>

        <HomeNavigationMobileMenu
          open={mobileOpen}
          onClose={closeMobile}
          items={HOME_NAV_ITEMS}
          navHref={navHref}
          registerHref={registerHref}
        />
      </HomeShell>
    </header>
  );
}
