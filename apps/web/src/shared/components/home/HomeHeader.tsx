'use client';

import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { cn } from '@/shared/lib/utils';

const bricolage = Bricolage_Grotesque({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
});

const dmSans = DM_Sans({
  weight: '600',
  subsets: ['latin'],
  display: 'swap',
});

/** Home landing header — full-width bar, brand chip (Figma 105:5369) + language + CTA. */
export function HomeHeader() {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    <header
      className="relative z-50 w-full border-b border-black/[0.08] bg-[#e8e4dc] backdrop-blur-sm"
      data-home-nav
    >
      <div className="flex min-h-14 w-full items-center justify-between gap-2 px-4 py-2.5 sm:min-h-[54px] sm:gap-3 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="group flex min-w-0 items-center"
          aria-label={t('title')}
        >
          <div className="inline-flex h-[50px] max-w-full items-center gap-2.5 rounded-full bg-white pl-2 pr-4 sm:h-[52px] sm:pr-5">
            <div
              className="relative h-7 w-7 shrink-0 rounded-[14px] bg-[#111] transition group-hover:opacity-90"
              aria-hidden
            >
              <div className="absolute bottom-0.5 left-0.5 h-2.5 w-2.5 rounded-sm bg-[#b8e986]" />
            </div>
            <span
              className={cn(
                bricolage.className,
                'truncate text-[#111] text-[1.1rem] leading-8 tracking-[-0.02em] sm:text-[1.25rem]'
              )}
            >
              {t('wordmark')}
            </span>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div
            className={cn(
              'origin-right scale-[0.9] sm:scale-100',
              '[&>div]:bg-white/35 [&>div]:shadow-none'
            )}
          >
            <LanguageSwitcher />
          </div>
          <Link
            href={`/${locale}/login`}
            className={cn(
              dmSans.className,
              'inline-flex h-10 min-h-10 items-center justify-center rounded-full bg-[#111] px-4 text-[13px] text-white no-underline transition',
              'hover:bg-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]/40',
              'active:scale-[0.99] sm:h-11 sm:px-5 sm:text-sm'
            )}
          >
            {t('getStarted')}
          </Link>
        </div>
      </div>
    </header>
  );
}
