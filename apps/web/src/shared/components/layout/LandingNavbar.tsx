'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { LandingMobileNavbarPill } from '@/shared/components/layout/LandingMobileNavbarPill';
import { LandingNavbarLanguageToggle } from '@/shared/components/layout/LandingNavbarLanguageToggle';
import {
  LANDING_MOBILE_HORIZONTAL_PADDING,
  LANDING_NAV_DESKTOP_MIN_WIDTH,
} from '@/shared/lib/landing-layout';
import { cn } from '@/shared/lib/utils';
import { LANDING_NAV_ITEMS, type LandingNavSectionId } from '@/features/landing/landingNav';

type LandingNavbarProps = {
  logoUrl: string;
  profileHref: string;
  logoHref?: string;
  activeSection?: LandingNavSectionId;
  onSectionNavigate?: (sectionId: LandingNavSectionId) => void;
};

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

function BurgerMenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-5 w-5" aria-hidden>
      <span
        className={cn(
          'absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out',
          open ? 'top-[9px] rotate-45' : 'top-[3px] rotate-0',
        )}
      />
      <span
        className={cn(
          'absolute left-0 top-[9px] block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out',
          open ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100',
        )}
      />
      <span
        className={cn(
          'absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out',
          open ? 'top-[9px] -rotate-45' : 'top-[15px] rotate-0',
        )}
      />
    </span>
  );
}

export function LandingNavbar({
  logoUrl,
  profileHref,
  logoHref = '#home',
  activeSection = 'home',
  onSectionNavigate,
}: LandingNavbarProps) {
  const t = useTranslations('home.nav');
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isOnLoginPage = pathname.endsWith('/login');
  const isOnHomePage = pathname === '/';
  const isHomeAnchorLogo = logoHref.startsWith('#');

  const getNavHref = (href: string) => (isOnHomePage ? href : `/${href}`);

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

  const handleLogoClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (!isHomeAnchorLogo) {
      setMenuOpen(false);
      return;
    }

    event.preventDefault();
    setMenuOpen(false);
    onSectionNavigate?.('home');
  };

  const handleNavClick = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    sectionId: LandingNavSectionId,
  ) => {
    setMenuOpen(false);

    if (!isOnHomePage) {
      return;
    }

    event.preventDefault();
    onSectionNavigate?.(sectionId);
  };

  const getNavLinkClassName = (sectionId: LandingNavSectionId, variant: 'desktop' | 'mobile') => {
    const isActive = activeSection === sectionId;

    if (variant === 'mobile') {
      return cn(
        'block rounded-2xl px-4 py-3 text-base font-medium tracking-[-0.2px] transition-colors duration-300',
        isActive ? 'bg-white/12 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white',
      );
    }

    return cn(
      'relative whitespace-nowrap font-normal tracking-[-0.3px] transition-colors duration-300',
      'text-sm navDesktop:text-base',
      isActive
        ? 'text-white after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-white/90 after:content-[""]'
        : 'text-white/70 hover:text-white',
    );
  };

  const iconButtonClassName =
    'relative inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-[34px] sm:w-[34px] tablet:h-[37px] tablet:w-[37px]';

  const menuMotionTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  const backdropMotionTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: 'easeOut' as const };

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 z-50 top-2 sm:top-3 tablet:top-3',
          LANDING_MOBILE_HORIZONTAL_PADDING,
          'tablet:px-0',
        )}
      >
        <div className="landing-canvas-scale-wrap w-full">
          <LandingMobileNavbarPill
            logoUrl={logoUrl}
            brandLabel={t('brand')}
            logoHref={logoHref}
            onLogoClick={handleLogoClick}
            canvasLayout
            languageToggleClassName="hidden lg:inline-flex"
            center={
              <>
                {LANDING_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.id}
                    href={getNavHref(item.href)}
                    onClick={(event) => handleNavClick(event, item.id)}
                    aria-current={activeSection === item.id ? 'page' : undefined}
                    className={getNavLinkClassName(item.id, 'desktop')}
                  >
                    {t(item.id)}
                  </Link>
                ))}
              </>
            }
            trailing={
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center text-white outline-none focus-visible:outline-none navDesktop:hidden sm:h-[34px] sm:w-[34px] tablet:h-[37px] tablet:w-[37px]"
                  aria-expanded={menuOpen}
                  aria-controls="landing-mobile-menu"
                  aria-label={menuOpen ? tCommon('close') : t('openMenu')}
                >
                  <BurgerMenuIcon open={menuOpen} />
                </button>

                {!isOnLoginPage ? (
                  <Link
                    href={profileHref}
                    aria-label={tHome('login')}
                    className={cn(iconButtonClassName, 'hidden navDesktop:inline-flex')}
                  >
                    <ProfileIcon className="h-full w-full" />
                  </Link>
                ) : null}
              </>
            }
          />
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              key="landing-mobile-menu-backdrop"
              type="button"
              className="fixed inset-0 z-40 bg-black/40 navDesktop:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label={tCommon('close')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={backdropMotionTransition}
            />
            <motion.nav
              key="landing-mobile-menu-panel"
              id="landing-mobile-menu"
              className={cn(
                'landing-mobile-menu-canvas fixed z-40 max-h-[min(70vh,calc(100dvh-5.5rem))] overflow-y-auto rounded-[28px] bg-[#093394] p-3 shadow-xl navDesktop:hidden',
                'inset-x-4 top-[calc(0.5rem+58px+0.5rem)] sm:top-[calc(0.75rem+64px+0.5rem)] tablet:top-[calc(0.75rem+70px+0.5rem)]',
              )}
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -10, scale: 0.98 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8, scale: 0.98 }
              }
              transition={menuMotionTransition}
            >
              <ul className="flex flex-col gap-1">
                {LANDING_NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={getNavHref(item.href)}
                      onClick={(event) => handleNavClick(event, item.id)}
                      aria-current={activeSection === item.id ? 'page' : undefined}
                      className={getNavLinkClassName(item.id, 'mobile')}
                    >
                      {t(item.id)}
                    </Link>
                  </li>
                ))}
                <li className="mt-1 border-t border-white/15 pt-1">
                  <div
                    className={cn(
                      'flex items-center gap-3 px-1 py-1',
                      isOnLoginPage ? 'justify-end' : 'justify-between',
                    )}
                  >
                    {!isOnLoginPage ? (
                      <Link
                        href={profileHref}
                        onClick={() => setMenuOpen(false)}
                        className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2 text-base font-medium tracking-[-0.2px] text-white transition-colors hover:bg-white/10"
                      >
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center">
                          <ProfileIcon className="h-full w-full" />
                        </span>
                        {tHome('login')}
                      </Link>
                    ) : null}
                    <LandingNavbarLanguageToggle className="shrink-0" />
                  </div>
                </li>
              </ul>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
