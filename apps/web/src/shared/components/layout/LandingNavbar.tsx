'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type MouseEvent } from 'react';
import { useSwitchLocale } from '@/shared/hooks/useSwitchLocale';
import { useLandingCanvasScale } from '@/shared/hooks/useLandingCanvasScale';
import {
  LANDING_DESIGN_WIDTH,
  LANDING_NAV_DESKTOP_MIN_WIDTH,
  LANDING_NAVBAR_HEIGHT,
} from '@/shared/lib/landing-layout';
import { cn } from '@/shared/lib/utils';

type LandingNavbarProps = {
  logoUrl: string;
  profileHref: string;
};

type NavItem = {
  id: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'home', href: '#home' },
  { id: 'about', href: '#about' },
  { id: 'courses', href: '#courses' },
  { id: 'teachers', href: '#teachers' },
  { id: 'branches', href: '#branches' },
  { id: 'contact', href: '#contact' },
  { id: 'blog', href: '#contact' },
];

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37" fill="none" className={className} aria-hidden>
      <g clipPath="url(#landing-profile-icon)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18 2.07233C8.33475 2.07233 0.5 9.90708 0.5 19.5723C0.5 29.2376 8.33475 37.0723 18 37.0723C27.6652 37.0723 35.5 29.2376 35.5 19.5723C35.5 9.90708 27.6652 2.07233 18 2.07233ZM11.875 15.1973C11.875 14.393 12.0334 13.5965 12.3412 12.8534C12.649 12.1103 13.1002 11.4351 13.669 10.8663C14.2377 10.2975 14.9129 9.84637 15.6561 9.53856C16.3992 9.23075 17.1957 9.07233 18 9.07233C18.8043 9.07233 19.6008 9.23075 20.3439 9.53856C21.0871 9.84637 21.7623 10.2975 22.331 10.8663C22.8998 11.4351 23.351 12.1103 23.6588 12.8534C23.9666 13.5965 24.125 14.393 24.125 15.1973C24.125 16.8218 23.4797 18.3797 22.331 19.5284C21.1824 20.677 19.6245 21.3223 18 21.3223C16.3755 21.3223 14.8176 20.677 13.669 19.5284C12.5203 18.3797 11.875 16.8218 11.875 15.1973ZM28.9515 28.2943C27.6411 29.9417 25.9756 31.2719 24.0794 32.1858C22.1831 33.0997 20.105 33.5737 18 33.5723C15.895 33.5737 13.8169 33.0997 11.9206 32.1858C10.0244 31.2719 8.35892 29.9417 7.0485 28.2943C9.88525 26.2591 13.7563 24.8223 18 24.8223C22.2437 24.8223 26.1147 26.2591 28.9515 28.2943Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="landing-profile-icon">
          <rect width="37" height="37" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function LandingNavbar({ logoUrl, profileHref }: LandingNavbarProps) {
  const t = useTranslations('home.nav');
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');
  const { locale, switchLocale } = useSwitchLocale();
  const { isCanvasActive, scale } = useLandingCanvasScale();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const mediaQuery = window.matchMedia(`(min-width: ${LANDING_NAV_DESKTOP_MIN_WIDTH}px)`);
    const closeOnDesktop = () => {
      if (mediaQuery.matches) {
        setMenuOpen(false);
      }
    };

    closeOnDesktop();
    mediaQuery.addEventListener('change', closeOnDesktop);

    return () => mediaQuery.removeEventListener('change', closeOnDesktop);
  }, [menuOpen]);

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  const scaledMenuTop = `calc(0.75rem + ${LANDING_NAVBAR_HEIGHT * scale}px + 0.5rem)`;

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 z-50',
          isCanvasActive ? 'top-3' : 'top-2 px-3 sm:top-3 sm:px-6',
        )}
      >
        <div
          className={cn(!isCanvasActive && 'w-full px-3 sm:px-6')}
          style={
            isCanvasActive
              ? {
                  width: LANDING_DESIGN_WIDTH,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }
              : undefined
          }
        >
          <div
            className={cn(
              'mx-auto flex w-full max-w-[1280px] items-center justify-between rounded-[100px] bg-[#093394] shadow-lg',
              isCanvasActive
                ? 'h-[70px] px-5'
                : 'h-[58px] px-3 sm:h-[64px] sm:px-4 tablet:h-[70px] tablet:px-5',
            )}
          >
            <Link
              href="#home"
              onClick={handleLogoClick}
              className={cn('flex min-w-0 items-center', isCanvasActive ? 'gap-3' : 'gap-2 sm:gap-3')}
            >
              <div
                className={cn(
                  'relative shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-white/40',
                  isCanvasActive
                    ? 'h-[52px] w-[52px]'
                    : 'h-[42px] w-[42px] sm:h-[48px] sm:w-[48px] tablet:h-[52px] tablet:w-[52px]',
                )}
              >
                <Image src={logoUrl} alt="Ilona English Centre" fill className="object-contain" unoptimized />
              </div>
              <span
                className={cn(
                  'truncate font-bold tracking-[-0.18px] text-white',
                  isCanvasActive
                    ? 'block text-[20px]'
                    : 'hidden text-[16px] min-[420px]:block sm:text-[18px] tablet:text-[20px]',
                )}
              >
                {t('brand')}
              </span>
            </Link>

            <nav
              className={cn(
                'hidden items-center text-white',
                isCanvasActive ? 'gap-8 navDesktop:flex' : 'gap-4 navDesktop:flex navDesktop:gap-6 xl:gap-8',
              )}
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'whitespace-nowrap font-normal tracking-[-0.3px] transition-opacity hover:opacity-80',
                    isCanvasActive ? 'text-base' : 'text-sm navDesktop:text-[15px] xl:text-base',
                  )}
                >
                  {t(item.id)}
                </Link>
              ))}
            </nav>

            <div className={cn('flex items-center', isCanvasActive ? 'gap-3' : 'gap-1.5 sm:gap-2 tablet:gap-3')}>
              <div className="inline-flex items-center rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f3f3f4] p-[3px]">
                <button
                  type="button"
                  onClick={() => switchLocale('hy')}
                  className={cn(
                    'rounded-full px-2 py-1 font-medium transition-colors',
                    isCanvasActive ? 'min-w-[42px] text-[12px]' : 'min-w-[38px] text-[11px] sm:min-w-[42px] sm:text-[12px]',
                    locale === 'hy' ? 'bg-[#093394] text-white' : 'text-[#5b5b62]/80',
                  )}
                >
                  ՀԱՅ
                </button>
                <button
                  type="button"
                  onClick={() => switchLocale('en')}
                  className={cn(
                    'rounded-full px-2 py-1 font-medium transition-colors',
                    isCanvasActive ? 'min-w-[42px] text-[12px]' : 'min-w-[38px] text-[11px] sm:min-w-[42px] sm:text-[12px]',
                    locale === 'en' ? 'bg-[#093394] text-white' : 'text-[#5b5b62]/80',
                  )}
                >
                  EN
                </button>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className={cn(
                  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full text-white transition-colors hover:bg-white/10 navDesktop:hidden',
                  isCanvasActive
                    ? 'h-[37px] w-[37px]'
                    : 'h-[32px] w-[32px] sm:h-[34px] sm:w-[34px] tablet:h-[37px] tablet:w-[37px]',
                )}
                aria-expanded={menuOpen}
                aria-controls="landing-mobile-menu"
                aria-label={menuOpen ? tCommon('close') : t('openMenu')}
              >
                {menuOpen ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              <Link
                href={profileHref}
                aria-label={tHome('login')}
                className={cn(
                  'relative hidden shrink-0 items-center justify-center overflow-hidden rounded-full navDesktop:inline-flex',
                  isCanvasActive
                    ? 'h-[37px] w-[37px]'
                    : 'h-[32px] w-[32px] sm:h-[34px] sm:w-[34px] tablet:h-[37px] tablet:w-[37px]',
                )}
              >
                <ProfileIcon className="h-full w-full" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 navDesktop:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label={tCommon('close')}
          />
          <nav
            id="landing-mobile-menu"
            className={cn(
              'fixed z-40 max-h-[min(70vh,calc(100dvh-5.5rem))] overflow-y-auto rounded-[28px] bg-[#093394] p-3 shadow-xl navDesktop:hidden',
              isCanvasActive
                ? 'inset-x-6'
                : 'inset-x-3 top-[calc(0.5rem+58px+0.5rem)] sm:inset-x-6 sm:top-[calc(0.75rem+64px+0.5rem)] tablet:top-[calc(0.75rem+70px+0.5rem)]',
            )}
            style={isCanvasActive ? { top: scaledMenuTop } : undefined}
          >
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className="block rounded-2xl px-4 py-3 text-base font-medium tracking-[-0.2px] text-white transition-colors hover:bg-white/10"
                  >
                    {t(item.id)}
                  </Link>
                </li>
              ))}
              <li className="mt-1 border-t border-white/15 pt-1">
                <Link
                  href={profileHref}
                  onClick={handleNavClick}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium tracking-[-0.2px] text-white transition-colors hover:bg-white/10"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center">
                    <ProfileIcon className="h-full w-full" />
                  </span>
                  {tHome('login')}
                </Link>
              </li>
            </ul>
          </nav>
        </>
      ) : null}
    </>
  );
}
