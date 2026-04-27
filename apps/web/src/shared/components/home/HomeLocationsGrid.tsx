'use client';

import { useTranslations } from 'next-intl';
import { bricolageDisplay, dmSansHome, jetbrainsMono } from '@/shared/components/home/home-fonts';
import { FigmaImage } from '@/shared/components/home/figma-image';
import {
  BRANCH_PIN_1,
  BRANCH_PIN_2,
  BRANCH_PIN_3,
  BRANCH_PIN_4,
} from '@/shared/components/home/home-figma-assets';
import { cn } from '@/shared/lib/utils';

const b = bricolageDisplay.className;
const d = dmSansHome.className;
const j = jetbrainsMono.className;

const PIN = [BRANCH_PIN_1, BRANCH_PIN_2, BRANCH_PIN_3, BRANCH_PIN_4] as const;
const BG = [
  'bg-[rgba(184,233,134,0.28)]',
  'bg-[rgba(255,210,63,0.25)]',
  'bg-[rgba(169,200,240,0.25)]',
  'bg-[rgba(255,138,107,0.17)]',
] as const;
const CHIP = ['bg-[#b8e986]', 'bg-[#ffd23f]', 'bg-[#a9c8f0]', 'bg-[#ff8a6b]'] as const;

const LOC = [
  { code: 'loc1Code' as const, name: 'loc1Name' as const, line2: 'loc1Line2' as const, detail: 'loc1Detail' as const, hours: 'loc1Hours' as const },
  { code: 'loc2Code' as const, name: 'loc2Name' as const, line2: 'loc2Line2' as const, detail: 'loc2Detail' as const, hours: 'loc2Hours' as const },
  { code: 'loc3Code' as const, name: 'loc3Name' as const, line2: 'loc3Line2' as const, detail: 'loc3Detail' as const, hours: 'loc3Hours' as const },
  { code: 'loc4Code' as const, name: 'loc4Name' as const, line2: 'loc4Line2' as const, detail: 'loc4Detail' as const, hours: 'loc4Hours' as const },
] as const;

export function HomeLocationsGrid() {
  const t = useTranslations('home');

  return (
    <section
      className="mx-auto w-full max-w-[1920px] px-4 py-12 sm:px-10 sm:py-16 lg:py-20"
      id="branches"
    >
      <p className={cn(j, 'text-[#8a8680] text-xs sm:text-sm')}>{t('branchesLabel')}</p>
      <div className="mt-2 flex flex-col gap-5 lg:mt-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <h2
          className={cn(
            b,
            'max-w-[22rem] text-balance text-[#111] text-[2.1rem] font-extrabold leading-tight sm:max-w-none sm:text-5xl sm:leading-tight md:text-6xl'
          )}
        >
          {t('branchesHeadline1')}
          <br />
          {t('branchesHeadline2')}
        </h2>
        <p
          className={cn(
            d,
            'max-w-md text-pretty text-[#4a4a4a] text-base leading-7 sm:text-lg lg:max-w-sm'
          )}
        >
          {t('branchesIntro')}
        </p>
      </div>
      <div className="mt-9 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
        {LOC.map((k, i) => (
          <div
            key={k.code}
            className={cn('relative min-h-[230px] overflow-hidden rounded-[22px] p-6', BG[i])}
          >
            <div className="flex items-center justify-between gap-2">
              <p
                className={cn(
                  j,
                  'text-[#8a8680] text-[0.7rem] tracking-tight sm:text-xs'
                )}
              >
                {t(k.code)}
              </p>
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-xl',
                  CHIP[i]
                )}
              >
                <FigmaImage
                  src={PIN[i] ?? BRANCH_PIN_1}
                  width={18}
                  height={18}
                  className="size-[18px]"
                  alt=""
                />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={cn(b, 'text-[#111] text-2xl font-bold leading-7 sm:text-2xl')}>
                {t(k.name)}
              </h3>
              <p className={cn(b, 'text-[#111] text-2xl font-bold leading-7 sm:text-2xl')}>
                {t(k.line2)}
              </p>
              <p
                className={cn(
                  d,
                  'mt-2.5 text-[#8a8680] text-sm font-medium leading-4 sm:text-sm'
                )}
              >
                {t(k.detail)}
              </p>
            </div>
            <div className="mt-4 flex items-end justify-between gap-2 sm:mt-5">
              <p
                className={cn(
                  j,
                  'text-[#8a8680] text-[0.65rem] sm:text-xs'
                )}
              >
                {t(k.hours)}
              </p>
              <a
                href="#branches"
                className="flex size-[34px] shrink-0 items-center justify-center rounded-2xl bg-[#111] text-sm text-white no-underline"
                aria-label="Open location"
              >
                →
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
