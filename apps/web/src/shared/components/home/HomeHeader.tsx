'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { bricolageDisplay, dmSansHome } from '@/shared/components/home/home-fonts';
import { cn } from '@/shared/lib/utils';

export function HomeHeader() {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    <header
      className="relative z-50 w-full bg-white"
      data-home-nav
    >
      <div className="mx-auto flex max-w-[1920px] min-h-[70px] w-full items-center justify-between gap-4 px-4 py-2.5 sm:px-10 sm:py-[22px] lg:px-[var(--edge,40px)]">
        <Link
          href={`/${locale}#top`}
          className="group flex min-w-0 items-center"
          aria-label={t('title')}
        >
          <div
            className={cn(
              'inline-flex h-[54px] max-w-full items-center gap-0 rounded-full bg-[#f4f1ea] pl-3.5 pr-5',
              bricolageDisplay.className
            )}
          >
            <div
              className="relative mr-2.5 h-7 w-7 shrink-0 rounded-[14px] bg-[#111] transition group-hover:opacity-90"
              aria-hidden
            >
              <div className="absolute bottom-1 left-0.5 h-2.5 w-2.5 rounded-sm bg-[#b8e986]" />
            </div>
            <span className="truncate text-[#111] text-[1.2rem] font-bold leading-8 tracking-[-0.02em] sm:text-[1.29rem]">
              {t('wordmark')}
            </span>
          </div>
        </Link>
        <div className="flex shrink-0 items-center">
          <Link
            href={`/${locale}/register`}
            className={cn(
              dmSansHome.className,
              'inline-flex h-[46px] min-w-[120px] items-center justify-center rounded-full bg-[#111] px-5 text-sm font-semibold text-white no-underline transition',
              'hover:bg-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]/40',
              'active:scale-[0.99]'
            )}
          >
            {t('getStarted')}
          </Link>
        </div>
      </div>
    </header>
  );
}
