'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { bricolageDisplay, dmSansHome } from '@/shared/components/home/home-fonts';
import { FigmaImage } from '@/shared/components/home/figma-image';
import { BENTO_CHART } from '@/shared/components/home/home-figma-assets';
import { cn } from '@/shared/lib/utils';

const b = bricolageDisplay.className;
const d = dmSansHome.className;

export function HomeBentoStrip() {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    <section className="mx-auto w-full max-w-[1920px] px-4 py-2 sm:px-10 sm:py-3 lg:px-10">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
        <div
          className={cn(
            b,
            'relative min-h-[220px] overflow-hidden rounded-3xl bg-[#b8e986] p-6 sm:p-7'
          )}
        >
          <div className="absolute -right-8 -top-10 h-[140px] w-[140px] rounded-full bg-black/[0.08] sm:-right-6" />
          <div className="relative z-[1]">
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-2.5">
              <p className="text-[#111] text-[1.6rem] font-bold leading-tight sm:text-3xl">
                {t('bentoStatValue')}
              </p>
              <p
                className={cn(
                  d,
                  'text-[#2a3a1f] text-xs font-medium sm:text-[0.8rem] sm:leading-5'
                )}
              >
                {t('bentoStatLabel')}
              </p>
            </div>
            <div className="mt-2 h-12 w-full max-w-[16rem] sm:mt-3 sm:h-14 sm:max-w-[18rem]">
              <FigmaImage
                src={BENTO_CHART}
                width={260}
                height={52}
                className="h-full w-full object-contain object-left"
                alt=""
              />
            </div>
            <p className="mt-4 text-[#111] text-[1.35rem] font-bold leading-snug sm:mt-6 sm:text-2xl">
              {t('bentoStatFooter')}
            </p>
          </div>
        </div>

        <div
          className={cn(
            b,
            'relative min-h-[220px] overflow-hidden rounded-3xl bg-[#111] p-6 sm:p-7'
          )}
        >
          <div className="absolute -right-6 -top-10 h-[140px] w-[140px] rounded-full bg-white/[0.05]" />
          <h2 className="relative z-[1] text-white text-2xl font-bold leading-8 sm:text-[1.8rem] sm:leading-9">
            {t('bentoClassLine1')}
            <br />
            {t('bentoClassLine2')}
          </h2>
          <div className="relative z-[1] mt-5 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-2">
            <div
              className={cn(
                d,
                'inline-flex h-14 min-w-0 max-w-full items-center gap-2.5 rounded-full border border-[#2a2a2a] bg-[#1d1d1d] pl-2.5 pr-3'
              )}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-[14px] bg-white text-[#111] text-xs font-bold">
                {t('bentoPill1Badge')}
              </span>
              <div>
                <p className="text-sm font-normal text-white leading-4">{t('bentoPill1Title')}</p>
                <p className="text-[#9a9a9a] text-[0.7rem] leading-4">{t('bentoPill1Sub')}</p>
              </div>
            </div>
            <div
              className={cn(
                d,
                'inline-flex h-14 min-w-0 max-w-full items-center gap-2.5 rounded-full border border-[#2a2a2a] bg-[#1d1d1d] pl-2.5 pr-3'
              )}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-[14px] bg-white text-[#111] text-xs font-bold">
                {t('bentoPill2Badge')}
              </span>
              <div>
                <p className="text-sm font-normal text-white leading-4">{t('bentoPill2Title')}</p>
                <p className="text-[#9a9a9a] text-[0.7rem] leading-4">{t('bentoPill2Sub')}</p>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            b,
            'relative min-h-[220px] overflow-hidden rounded-3xl bg-[#ffd23f] p-6 sm:p-7 md:col-span-2 xl:col-span-1'
          )}
        >
          <div className="absolute -right-5 -top-9 h-[140px] w-[140px] rounded-full bg-black/[0.06]" />
          <h2 className="relative z-[1] max-w-[200px] text-[#111] text-[1.35rem] font-bold leading-7 sm:max-w-none sm:text-2xl sm:leading-8">
            {t('bentoJoinLine1')}
            <br />
            {t('bentoJoinLine2')}
          </h2>
          <div className="relative z-[1] mt-5 flex flex-wrap sm:mt-4">
            <div className="flex -space-x-1.5">
              {(['#d47b5a', '#3a6b8a', '#5a7d42', '#8a5a3a'] as const).map(
                (bg, i) => (
                  <div
                    key={bg}
                    className="relative z-[calc(4-i)] flex size-10 items-center justify-center rounded-full border-[3px] border-[#ffd23f] text-sm font-bold text-white sm:size-11"
                    style={{ background: bg }}
                  >
                    {(['A', 'M', 'N', 'S'] as const)[i]}
                  </div>
                )
              )}
            </div>
          </div>
          <div className="relative z-[1] mt-3 sm:mt-2">
            <Link
              href={`/${locale}/register`}
              className={cn(
                d,
                'inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-[#111] text-xs font-semibold no-underline',
                'hover:opacity-95 sm:text-[0.8rem]'
              )}
            >
              {t('bentoJoinCta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
