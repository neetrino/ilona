'use client';

import { useTranslations } from 'next-intl';
import { bricolageDisplay, dmSansHome, jetbrainsMono } from '@/shared/components/home/home-fonts';
import { FigmaImage } from '@/shared/components/home/figma-image';
import {
  FEAT_ANALYTICS,
  FEAT_ATTENDANCE,
  FEAT_CHAT,
  FEAT_FINANCE,
  FEAT_STUDENT,
  FEAT_TEACHER,
} from '@/shared/components/home/home-figma-assets';
import { cn } from '@/shared/lib/utils';

const b = bricolageDisplay.className;
const d = dmSansHome.className;
const j = jetbrainsMono.className;

const TINT = {
  coral: 'bg-[#ff8a6b]',
  blue: 'bg-[#8bb8e8]',
  purple: 'bg-[#c5a9e8]',
} as const;
type DarkIconTint = keyof typeof TINT;

const CARDS: {
  title: 'feature1Title' | 'feature2Title' | 'feature3Title' | 'feature4Title' | 'feature5Title' | 'feature6Title';
  body:
    | 'feature1DescriptionFigma'
    | 'feature2DescriptionFigma'
    | 'feature3DescriptionFigma'
    | 'feature4DescriptionFigma'
    | 'feature5DescriptionFigma'
    | 'feature6DescriptionFigma';
  icon: string;
  wrap: 'yellow' | 'dark' | 'green' | 'coral';
  darkIconTint?: DarkIconTint;
}[] = [
  { title: 'feature1Title', body: 'feature1DescriptionFigma', icon: FEAT_STUDENT, wrap: 'yellow' },
  { title: 'feature2Title', body: 'feature2DescriptionFigma', icon: FEAT_TEACHER, wrap: 'dark', darkIconTint: 'coral' },
  { title: 'feature3Title', body: 'feature3DescriptionFigma', icon: FEAT_ATTENDANCE, wrap: 'dark', darkIconTint: 'blue' },
  { title: 'feature4Title', body: 'feature4DescriptionFigma', icon: FEAT_FINANCE, wrap: 'green' },
  { title: 'feature5Title', body: 'feature5DescriptionFigma', icon: FEAT_ANALYTICS, wrap: 'dark', darkIconTint: 'purple' },
  { title: 'feature6Title', body: 'feature6DescriptionFigma', icon: FEAT_CHAT, wrap: 'coral' },
];

const wrapMap = {
  yellow: {
    card: 'bg-[#f5d547]',
    sub: 'text-[#3a2f22]',
  },
  dark: {
    card: 'bg-[#1a1614]',
    sub: 'text-[#c9bfb1]',
  },
  green: {
    card: 'bg-[#7fb77e]',
    sub: 'text-[#25381f]',
  },
  coral: {
    card: 'bg-[#ff8a6b]',
    sub: 'text-[#4a201a]',
  },
} as const;

function iconBoxClass(
  c: (typeof CARDS)[number]
): string {
  if (c.wrap === 'dark' && c.darkIconTint) {
    return TINT[c.darkIconTint] ?? TINT.coral;
  }
  if (c.wrap === 'yellow' || c.wrap === 'green' || c.wrap === 'coral') {
    return 'bg-[#1a1614]';
  }
  return 'bg-[#1a1614]';
}

export function HomePlatformGrid() {
  const t = useTranslations('home');

  return (
    <section
      className="mx-auto w-full max-w-[1920px] scroll-mt-8 px-4 py-12 sm:px-10 sm:py-16 lg:py-20"
      id="platform"
    >
      <p className={cn(j, 'text-[#7a6a4e] text-xs sm:text-sm')}>{t('platformLabel')}</p>
      <div className="mt-2 flex flex-col gap-5 sm:mt-3 lg:flex-row lg:items-end lg:justify-between">
        <h2
          className={cn(
            b,
            'max-w-[20rem] text-balance text-[#1a1614] text-[2rem] font-extrabold leading-tight sm:max-w-none sm:text-5xl sm:leading-[1.1] md:text-6xl'
          )}
        >
          {t('featuresTitle')}.
        </h2>
        <p
          className={cn(
            d,
            'max-w-sm text-pretty text-[#4a3e2e] text-base leading-7 sm:max-w-md sm:text-lg'
          )}
        >
          {t('featuresSubtitleFigma')}
        </p>
      </div>
      <div
        className={cn(
          'mt-9 grid grid-cols-1 items-stretch gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2',
          'xl:grid-cols-3'
        )}
      >
        {CARDS.map((c) => {
          const w = c.wrap;
          const colors = wrapMap[w];
          return (
            <div
              key={c.title}
              className={cn(
                'relative flex h-full min-h-[260px] max-md:min-h-[24rem] flex-col overflow-hidden rounded-[22px] p-6',
                'sm:p-7',
                colors.card
              )}
            >
              <div
                className={cn(
                  'inline-flex size-[52px] shrink-0 items-center justify-center rounded-[14px]',
                  iconBoxClass(c)
                )}
              >
                <FigmaImage src={c.icon} width={22} height={22} className="size-[22px]" alt="" />
              </div>
              <div className="mt-6 flex min-h-0 flex-1 flex-col sm:mt-8">
                <h3
                  className={cn(
                    b,
                    'shrink-0 text-2xl font-bold leading-7',
                    w === 'dark' ? 'text-[#f5efe6]' : 'text-[#1a1614]'
                  )}
                >
                  {t(c.title)}
                </h3>
                <p
                  className={cn(
                    d,
                    'mt-1.5 max-w-[20rem] grow text-pretty text-[15px] font-normal leading-[22px]',
                    colors.sub
                  )}
                >
                  {t(c.body)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
