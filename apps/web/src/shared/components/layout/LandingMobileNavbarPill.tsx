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
  isCanvasActive?: boolean;
  showLanguageToggle?: boolean;
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
  isCanvasActive = false,
  showLanguageToggle = true,
  logoOnError,
  enlargeLogoInner = false,
}: LandingMobileNavbarPillProps) {
  const brandClassName = cn(
    'min-w-0 truncate font-bold tracking-[-0.18px] text-white',
    isCanvasActive
      ? 'text-[20px]'
      : 'text-[14px] min-[420px]:text-[16px] sm:text-[18px] tablet:text-[20px]',
  );

  const logoBlock = (
    <>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-white/40',
          isCanvasActive
            ? 'h-[52px] w-[52px]'
            : 'h-[42px] w-[42px] sm:h-[48px] sm:w-[48px] tablet:h-[52px] tablet:w-[52px]',
        )}
      >
        <Image
          src={logoUrl}
          alt={brandLabel}
          fill
          className={cn('object-contain', enlargeLogoInner && 'scale-[1.22]')}
          unoptimized
          onError={logoOnError}
        />
      </div>
      <span className={brandClassName}>{brandLabel}</span>
    </>
  );

  const logoWrapClassName = cn(
    'flex min-w-0 items-center',
    isCanvasActive ? 'gap-3' : 'flex-1 gap-2 pr-2 sm:gap-3',
  );

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between rounded-[100px] bg-[#093394] shadow-lg',
        isCanvasActive
          ? 'mx-auto h-[70px] max-w-[1280px] px-5'
          : 'h-[58px] px-3 sm:h-[64px] sm:px-4 tablet:h-[70px] tablet:px-5',
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
            'hidden items-center text-white',
            isCanvasActive ? 'gap-8 navDesktop:flex' : 'gap-4 navDesktop:flex navDesktop:gap-6 xl:gap-8',
          )}
        >
          {center}
        </nav>
      ) : null}

      <div className={cn('flex items-center', isCanvasActive ? 'gap-3' : 'gap-1.5 sm:gap-2 tablet:gap-3')}>
        {showLanguageToggle ? <LandingNavbarLanguageToggle isCanvasActive={isCanvasActive} /> : null}
        {trailing}
      </div>
    </div>
  );
}
