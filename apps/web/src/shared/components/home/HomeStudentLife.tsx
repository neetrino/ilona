'use client';

import { useTranslations } from 'next-intl';
import { bricolageDisplay, dmSansHome, jetbrainsMono } from '@/shared/components/home/home-fonts';
import { cn } from '@/shared/lib/utils';

const b = bricolageDisplay.className;
const d = dmSansHome.className;
const j = jetbrainsMono.className;

export function HomeStudentLife() {
  const t = useTranslations('home');

  return (
    <section
      className="mx-auto w-full max-w-[1920px] px-4 py-12 sm:px-10 sm:py-16 lg:py-20"
      id="student-life"
    >
      <p className={cn(j, 'text-[#8a8680] text-xs sm:text-sm')}>{t('studentLifeLabel')}</p>
      <div className="mt-2 flex flex-col gap-5 sm:mt-3 lg:flex-row lg:items-end lg:justify-between">
        <h2
          className={cn(
            b,
            'max-w-[20rem] text-balance text-[#111] text-[2rem] font-extrabold leading-tight sm:max-w-[28rem] sm:text-5xl sm:leading-[1.05] md:text-6xl'
          )}
        >
          {t('studentLifeTitle')}
        </h2>
        <p
          className={cn(
            d,
            'max-w-sm text-pretty text-[#4a4a4a] text-base leading-7 sm:max-w-md sm:text-lg'
          )}
        >
          {t('studentLifeIntroFigma')}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-12">
        <div className="flex min-h-[280px] flex-col justify-between overflow-hidden rounded-3xl bg-[#b8e986] p-5 sm:min-h-[360px] sm:p-6 lg:col-span-5 lg:min-h-[420px]">
          <p className={cn(j, 'text-[#3f5b22] text-[0.7rem] sm:text-xs')}>{t('lifeFeatured')}</p>
          <div className="mt-auto">
            <h3 className={cn(b, 'text-[#111] text-3xl font-bold leading-tight sm:text-4xl sm:leading-tight')}>
              {t('lifeSpeaking1')}
              <br />
              {t('lifeSpeaking2')}
            </h3>
            <p
              className={cn(
                d,
                'mt-3 max-w-sm text-pretty text-[#243818] text-[0.95rem] leading-6 sm:text-[15px] sm:leading-6'
              )}
            >
              {t('lifeSpeakingP')}
            </p>
          </div>
        </div>

        <div
          className={cn(
            'min-h-[220px] overflow-hidden rounded-3xl p-5 sm:min-h-[300px] sm:p-6 lg:col-span-3',
            "bg-gradient-to-br from-zinc-100/90 to-zinc-200/40"
          )}
        >
          <p className={cn(j, 'text-[#8a8680] text-[0.7rem] sm:text-xs')}>{t('lifeImgLabel1')}</p>
          <h3
            className={cn(
              b,
              'mt-auto block pt-16 text-[#111] text-2xl font-bold leading-8 sm:pt-24 sm:text-3xl'
            )}
          >
            {t('lifeSmall1a')}
            <br />
            {t('lifeSmall1b')}
          </h3>
        </div>

        <div className="flex min-h-0 flex-col gap-4 lg:col-span-4">
          <div
            className={cn(
              'min-h-[180px] flex-1 overflow-hidden rounded-3xl p-5 sm:min-h-[200px] sm:p-6',
              "bg-gradient-to-br from-zinc-100/90 to-zinc-200/40"
            )}
          >
            <p className={cn(j, 'text-[#8a8680] text-[0.7rem] sm:text-xs')}>{t('lifeEventLabel')}</p>
            <h3
              className={cn(
                b,
                'mt-12 text-[#111] text-2xl font-bold leading-8 sm:mt-16 sm:text-3xl'
              )}
            >
              {t('lifeBook')}
            </h3>
          </div>
          <div className="min-h-[180px] flex-1 overflow-hidden rounded-3xl border border-[#e7e3d9] bg-white p-5 sm:min-h-[200px] sm:p-6">
            <p className={cn(j, 'text-[#8a8680] text-[0.7rem] sm:text-xs')}>{t('lifeAwards')}</p>
            <h3
              className={cn(
                b,
                'mt-8 text-[#111] text-2xl font-bold leading-8 sm:mt-12 sm:text-3xl'
              )}
            >
              {t('lifeTop')}
              <br />
              {t('lifeTop2')}
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}
