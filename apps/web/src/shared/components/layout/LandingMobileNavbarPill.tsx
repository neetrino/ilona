'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MouseEvent, ReactNode, SyntheticEvent } from 'react';
import { LandingNavbarLanguageToggle } from './LandingNavbarLanguageToggle';
import { cn } from '@/shared/lib/utils';

type LandingMobileNavbarPillProps = {
  logoUrl: string;
  brandLabel: string;
  logoHref?: string;
  onLogoClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  center?: ReactNode;
  trailing?: ReactNode;
  /** Landing home: centered pill + canvas spacing from the tablet breakpoint up. */
  canvasLayout?: boolean;
  showLanguageToggle?: boolean;
  languageToggleClassName?: string;
  logoOnError?: (event: SyntheticEvent<HTMLImageElement>) => void;
  enlargeLogoInner?: boolean;
};

export function LandingMobileNavbarPill({
  logoUrl,
  brandLabel,
  logoHref,
  onLogoClick,
  center,
  trailing,
  canvasLayout = false,
  showLanguageToggle = true,
  languageToggleClassName,
  logoOnError,
  enlargeLogoInner = false,
}: LandingMobileNavbarPillProps) {
  const logoBlock = (
    <>
      <div className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-white/40 sm:h-[48px] sm:w-[48px] tablet:h-[52px] tablet:w-[52px]">
        <Image
          src={logoUrl}
          alt={brandLabel}
          fill
          className={cn('object-contain', enlargeLogoInner && 'scale-[1.22]')}
          unoptimized
          onError={logoOnError}
        />
      </div>
      <span className="min-w-0 truncate text-[14px] font-bold tracking-[-0.18px] text-white min-[420px]:text-[16px] sm:text-[18px] tablet:text-[20px]">
        {brandLabel}
      </span>
    </>
  );

  const logoWrapClassName = cn(
    'flex min-w-0 items-center flex-1 gap-2 pr-2 sm:gap-3',
    canvasLayout && 'tablet:flex-none tablet:gap-3 tablet:pr-0',
  );

  return (
    <div
      className={cn(
        'flex h-[58px] w-full items-center justify-between rounded-[100px] bg-[#093394] px-3 shadow-lg sm:h-[64px] sm:px-4 tablet:h-[70px] tablet:px-5',
        canvasLayout && 'tablet:mx-auto tablet:max-w-[1280px]',
      )}
    >
      {logoHref ? (
        <Link href={logoHref} onClick={onLogoClick} className={logoWrapClassName}>
          {logoBlock}
        </Link>
      ) : (
        <div className={logoWrapClassName}>{logoBlock}</div>
      )}

      {center ? (
        <nav
          className={cn(
            'hidden items-center gap-4 text-white navDesktop:flex',
            canvasLayout ? 'navDesktop:gap-8' : 'navDesktop:gap-6 xl:gap-8',
          )}
        >
          {center}
        </nav>
      ) : null}

      <div className="flex items-center gap-1.5 sm:gap-2 tablet:gap-3">
        {showLanguageToggle ? (
          <LandingNavbarLanguageToggle className={languageToggleClassName} />
        ) : null}
        {trailing}
      </div>
    </div>
  );
}
