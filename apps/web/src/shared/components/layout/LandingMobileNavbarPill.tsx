'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';
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
};

export function LandingMobileNavbarPill({
  logoUrl,
  brandLabel,
  logoHref,
  onLogoClick,
  center,
  trailing,
  isCanvasActive = false,
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
        <Image src={logoUrl} alt={brandLabel} fill className="object-contain" unoptimized />
      </div>
      <span className={brandClassName}>{brandLabel}</span>
    </>
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
        <Link
          href={logoHref}
          onClick={onLogoClick}
          className={cn(
            'flex min-w-0 flex-1 items-center pr-2',
            isCanvasActive ? 'gap-3' : 'gap-2 sm:gap-3',
          )}
        >
          {logoBlock}
        </Link>
      ) : (
        <div
          className={cn(
            'flex min-w-0 flex-1 items-center pr-2',
            isCanvasActive ? 'gap-3' : 'gap-2 sm:gap-3',
          )}
        >
          {logoBlock}
        </div>
      )}

      {center ? (
        <nav
          className={cn(
            'hidden min-w-0 flex-1 items-center justify-center text-white',
            isCanvasActive ? 'gap-8 navDesktop:flex' : 'gap-4 navDesktop:flex navDesktop:gap-6 xl:gap-8',
          )}
        >
          {center}
        </nav>
      ) : null}

      <div className={cn('flex shrink-0 items-center', isCanvasActive ? 'gap-3' : 'gap-1.5 sm:gap-2 tablet:gap-3')}>
        <LandingNavbarLanguageToggle isCanvasActive={isCanvasActive} />
        {trailing}
      </div>
    </div>
  );
}
