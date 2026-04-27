'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { bricolageDisplay, dmSansHome } from '@/shared/components/home/home-fonts';
import { FigmaImage } from '@/shared/components/home/figma-image';
import {
  HeroDecoRingIcon,
  HeroDecoStarIcon,
  HeroDecoTriangleIcon,
} from '@/shared/components/home/hero-salmon-deco-icons';
import { HERO_ILLUSTRATION, HERO_CTA_CAP, HERO_CTA_CIRCLE } from '@/shared/components/home/home-figma-assets';
import { cn } from '@/shared/lib/utils';

const heroDisplay = bricolageDisplay.className;
const body = dmSansHome.className;

/**
 * Pills and “inline” title lines (Manage / Learning Center / with) use the same `em` scale
 * as the h1, so 1.95em matches the word in the “English” pill.
 */
const heroPillTypeSize = 'text-[1.95em]';

/** Slight stroke: Bricolage has no 900; `!font-extrabold` enforces 800 over next/font’s class. */
const heroTypeEmbolden = '[-webkit-text-stroke:0.042em_currentColor]';

const heroTextMatchEnglish = cn('text-inherit', heroPillTypeSize, '!font-extrabold', heroTypeEmbolden);

/** h1 has `text-balance`; for “Learning Center” we use normal wrap so the two words stay on one line when they fit. */
const heroTextMatchEnglishLine3 = cn(heroTextMatchEnglish, 'inline-block [text-wrap:wrap] max-w-full');

/**
 * `heroTitle` applies to the h1. Inner spans with `heroTextMatchEnglish` use 1.95em so they match
 * the “English” pill. Pills add tight `line-height` so the fixed Figma block heights are preserved.
 */
const heroTitle = cn(
  'text-balance',
  '!font-extrabold',
  'text-[#1A1614] antialiased',
  'tracking-[-0.04em] sm:tracking-[-0.05em] lg:tracking-[-0.06em]',
  'leading-[0.94] sm:leading-[0.92] xl:leading-[0.9]',
  'text-[clamp(1.9rem,0.1rem+3.65vw,3.72rem)]'
);

const pillTextBoost = cn(
  'text-inherit',
  heroPillTypeSize,
  '[line-height:0.75] sm:[line-height:0.73] xl:[line-height:0.71]',
  '[letter-spacing:inherit] !font-extrabold antialiased',
  heroTypeEmbolden
);

const pillBox = cn(
  'box-border flex min-w-0 max-w-full items-center justify-center',
  'text-balance [overflow-wrap:anywhere]',
  'text-center',
  'antialiased',
  'overflow-hidden'
);

/** Your pill — override pillBox’s overflow-wrap:anywhere so the word does not break mid-line on narrow widths */
const pillTextYour = cn(
  pillBox,
  pillTextBoost,
  'whitespace-nowrap [overflow-wrap:normal]',
  'h-[110px] w-[min(100%,315px)] shrink-0 rounded-[30px] bg-[#ABEE00] md:w-[315px]',
  'px-3 sm:px-3.5 max-sm:px-2.5 max-md:px-2.5'
);
/** 456×123 (English) */
const pillTextEnglish = cn(
  pillBox,
  pillTextBoost,
  'h-[123px] w-[min(100%,456px)] shrink-0 rounded-[30px] bg-[#66B2FF] md:w-[456px]',
  'px-2.5 sm:px-3 max-sm:px-2.5'
);
/** 308×100 (Ease) — same sizing pass as other pills; typography unchanged */
const pillTextEase = cn(
  pillBox,
  pillTextBoost,
  'h-[100px] w-[min(100%,308px)] shrink-0 rounded-[30px] bg-[#FFCD2C] md:w-[308px]',
  'px-3 sm:px-3.5 max-sm:px-2.5'
);

export function HomeHero() {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    <section
      className="relative mx-auto w-full max-w-[1920px] overflow-hidden px-4 pt-2 pb-12 sm:px-10 sm:pt-3 sm:pb-16 lg:px-10 lg:pb-20 xl:px-14"
      id="top"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-4">
        <div className="relative z-[1] max-w-[50rem] mt-8 sm:mt-10 md:mt-12 lg:mt-16">
          <h1
            className={cn(heroTitle, heroDisplay, 'mt-0 max-w-[min(100%,64rem)]')}
          >
            <span className="mb-0 flex w-full min-w-0 max-w-full flex-wrap items-center gap-2.5 sm:mb-0 sm:flex-nowrap sm:gap-3.5">
              <span className={cn(heroTextMatchEnglish, 'shrink-0')}>{t('heroLine1a')}</span>
              <span className={pillTextYour}>{t('heroLine1b')}</span>
            </span>
            <span className="mt-2.5 flex w-full min-w-0 max-w-full flex-col gap-1.5 sm:mt-3.5 sm:flex-row sm:items-stretch sm:gap-3 sm:pl-0 md:pl-0">
              <span
                className={cn(
                  'box-border flex w-[min(100%,360px)] shrink-0',
                  'h-[104px] items-center justify-center gap-1.5 rounded-[30px] bg-[#FF8A6B]',
                  'px-2 py-0 sm:gap-1.5',
                  'md:w-[360px]'
                )}
                aria-hidden
              >
                <HeroDecoStarIcon className="h-[96px] w-[96px] sm:h-[98px] sm:w-[98px]" />
                <HeroDecoRingIcon className="h-[96px] w-[96px] sm:h-[98px] sm:w-[98px]" />
                <HeroDecoTriangleIcon className="h-[96px] w-[96px] sm:h-[98px] sm:w-[98px]" />
              </span>
              <span className={pillTextEnglish}>{t('heroLine2')}</span>
            </span>
            <span className="mb-0 mt-2.5 block w-full min-w-0 text-inherit sm:mt-3.5">
              <span className={heroTextMatchEnglishLine3}>{t('heroLine3')}</span>
            </span>
            <span className="mt-1.5 flex min-w-0 max-w-full flex-col gap-1.5 sm:mt-2.5 sm:flex-row sm:items-baseline sm:gap-3.5">
              <span className={heroTextMatchEnglish}>{t('heroLine4a')}</span>
              <span className={pillTextEase}>{t('heroLine4b')}</span>
            </span>
          </h1>

          <p
            className={cn(
              body,
              'mt-5 max-w-[30rem] text-pretty text-[#4a4a4a] text-base leading-7 sm:mt-7 sm:text-lg md:max-w-lg md:text-[1.1rem] md:leading-8'
            )}
          >
            {t('heroSubFigma')}
          </p>

          <div className="mt-6 sm:mt-8">
            <Link
              href={`/${locale}/login`}
              className={cn(
                body,
                'group relative inline-flex h-[60px] w-full max-w-[12rem] items-center rounded-full bg-[#141414] pl-0 pr-0.5 text-sm font-semibold text-white no-underline transition',
                'hover:bg-[#0a0a0a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                'sm:max-w-[11.7rem]'
              )}
            >
              <span className="pl-6 pr-0">{t('signIn')}</span>
              <span className="relative ml-auto flex h-[50px] w-[50px] shrink-0 items-center justify-center pr-0.5">
                <FigmaImage
                  src={HERO_CTA_CIRCLE}
                  width={50}
                  height={50}
                  className="absolute size-[50px]"
                  alt=""
                />
                <FigmaImage
                  src={HERO_CTA_CAP}
                  width={36}
                  height={36}
                  className="relative z-[1] size-9"
                  alt=""
                />
              </span>
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[220px] items-start justify-end lg:min-h-0">
          <FigmaImage
            src={HERO_ILLUSTRATION}
            width={1164}
            height={874}
            priority
            className="h-auto w-full max-w-[17rem] object-contain sm:max-w-sm md:max-w-md lg:ml-auto lg:max-w-lg xl:max-w-none xl:pr-4"
            alt=""
          />
        </div>
      </div>
    </section>
  );
}
