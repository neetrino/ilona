'use client';

import { useTranslations } from 'next-intl';
import { bricolageDisplay, dmSansHome, jetbrainsMono } from '@/shared/components/home/home-fonts';
import { FigmaImage } from '@/shared/components/home/figma-image';
import { LEARN_BG, LEARN_ILLUSTRATION } from '@/shared/components/home/home-figma-assets';
import { cn } from '@/shared/lib/utils';

const b = bricolageDisplay.className;
const d = dmSansHome.className;
const j = jetbrainsMono.className;

export function HomeLearnWithUs() {
  const t = useTranslations('home');

  return (
    <section
      className="relative z-10 mx-auto w-full max-w-[1920px] overflow-visible px-4 pt-12 pb-24 sm:px-10 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32"
      id="about"
    >
      <div className="pointer-events-none absolute inset-0 flex justify-end opacity-40">
        <div className="relative h-full w-full max-w-4xl mix-blend-multiply lg:max-w-5xl">
          <FigmaImage
            src={LEARN_BG}
            width={1172}
            height={897}
            className="h-full w-full object-cover object-right"
            alt=""
          />
        </div>
      </div>

      <p
        className={cn(
          j,
          'relative z-[1] text-[#8a8680] text-xs sm:text-sm'
        )}
      >
        {t('learnLabel')}
      </p>
      <h2
        className={cn(
          b,
          'relative z-[1] mt-1 max-w-4xl text-balance text-[#111] text-[2.1rem] font-extrabold leading-tight sm:text-5xl sm:leading-tight md:text-6xl md:leading-[1.05] lg:mt-2'
        )}
      >
        {t('learnTitleBefore')}
        <span className="text-[#1dacff]">{t('learnTitleSpan')}</span>
        {t('learnTitleAfter')}
      </h2>
      <p
        className={cn(
          d,
          'relative z-[1] mt-3 max-w-2xl text-[#4a4a4a] text-base leading-7 sm:mt-4 sm:text-lg'
        )}
      >
        {t('learnIntro')}
      </p>

      <div className="relative z-[1] mt-10 grid gap-8 lg:mt-12 lg:grid-cols-2 lg:items-end lg:gap-6">
        <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
          <FigmaImage
            src={LEARN_ILLUSTRATION}
            width={400}
            height={400}
            className="w-full max-w-[15.25rem] object-contain sm:max-w-[18rem] translate-x-[60%] translate-y-[60%]"
            alt=""
          />
        </div>
        <div className="order-1 h-auto min-h-[200px] rounded-[2.2rem] bg-[rgba(239,243,251,0.45)] p-6 backdrop-blur-sm sm:p-8 lg:order-2 lg:max-w-md lg:-translate-x-full lg:-translate-y-[10%]">
          <h3 className={cn(b, 'text-[#111] text-2xl font-bold leading-tight sm:text-4xl sm:leading-tight')}>
            {t('aboutCardH1')}
            <br />
            {t('aboutCardH2')}
          </h3>
          <p
            className={cn(
              d,
              'mt-4 text-pretty text-[#243818] text-base leading-7 sm:mt-5 sm:text-[1.05rem] sm:leading-7'
            )}
          >
            {t('aboutCardP')}
          </p>
        </div>
      </div>
    </section>
  );
}
