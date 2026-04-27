'use client';

import { useTranslations } from 'next-intl';
import { bricolageDisplay, dmSansHome, jetbrainsMono } from '@/shared/components/home/home-fonts';
import { cn } from '@/shared/lib/utils';

const b = bricolageDisplay.className;
const d = dmSansHome.className;
const j = jetbrainsMono.className;

const STEPS = [
  { num: '01', color: 'text-[#b8e986]', title: 'step1TitleFigma' as const, body: 'step1DescFigma' as const },
  { num: '02', color: 'text-[#ffd23f]', title: 'step2TitleFigma' as const, body: 'step2DescFigma' as const },
  { num: '03', color: 'text-[#ff8a6b]', title: 'step3TitleFigma' as const, body: 'step3DescFigma' as const },
] as const;

export function HomeHowItWorks() {
  const t = useTranslations('home');

  return (
    <section
      className="mx-auto w-full max-w-[1920px] px-4 py-12 sm:px-10 sm:py-16 lg:py-20"
      id="how-it-works"
    >
      <p className={cn(j, 'text-[#8a8680] text-xs sm:text-sm')}>{t('howLabel')}</p>
      <div className="mt-2 flex flex-col gap-5 sm:mt-3 lg:flex-row lg:items-end lg:justify-between">
        <h2
          className={cn(
            b,
            'max-w-[20rem] text-balance text-[#111] text-[2rem] font-extrabold leading-tight sm:max-w-md sm:text-5xl sm:leading-[1.05] md:text-6xl'
          )}
        >
          {t('howHeadline1')}
          <br />
          {t('howHeadline2')}
        </h2>
        <p
          className={cn(
            d,
            'max-w-sm text-pretty text-[#4a4a4a] text-base leading-7 sm:max-w-sm sm:text-lg'
          )}
        >
          {t('howIntro1')}
          <br />
          {t('howIntro2')}
        </p>
      </div>
      <div className="mt-9 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-5 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.num}
            className="relative min-h-[240px] overflow-hidden rounded-[26px] border border-[#e7e3d9] bg-white p-6 sm:min-h-[260px] sm:p-7"
          >
            <p className={cn(b, 'text-6xl font-bold leading-none sm:text-7xl', s.color)}>{s.num}</p>
            <h3 className={cn(b, 'mt-2 text-[#111] text-2xl font-bold leading-8 sm:mt-3 sm:text-2xl')}>
              {t(s.title)}
            </h3>
            <p
              className={cn(
                d,
                'mt-2.5 max-w-[20rem] text-pretty text-[#4a4a4a] text-[0.95rem] leading-6 sm:text-base sm:leading-6'
              )}
            >
              {t(s.body)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
