'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { bricolageDisplay, dmSansHome, jetbrainsMono } from '@/shared/components/home/home-fonts';
import { FigmaImage } from '@/shared/components/home/figma-image';
import { CTA_PORTRAIT } from '@/shared/components/home/home-figma-assets';
import { cn } from '@/shared/lib/utils';

const b = bricolageDisplay.className;
const d = dmSansHome.className;
const j = jetbrainsMono.className;

export function HomeFinalCta() {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    <section className="mx-auto w-full max-w-[1920px] px-4 py-10 sm:px-10 sm:py-12 lg:py-16">
      <div
        className="relative flex min-h-[400px] flex-col overflow-hidden rounded-[40px] bg-[#a7ff4d] px-5 py-8 sm:min-h-[480px] sm:px-8 sm:py-10 md:px-10 md:py-12 lg:min-h-[520px] lg:flex-row lg:items-center"
      >
        <div
          className="pointer-events-none absolute -right-20 -top-16 size-[420px] opacity-90 sm:-right-10"
          style={{
            background: `url("data:image/svg+xml;utf8,${encodeURIComponent(
              "<svg viewBox='0 0 420 420' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(8 17.85 -17.85 8 210 210)'><stop stop-color='rgba(63,194,255,1)' offset='0'/><stop stop-color='rgba(130,225,132,1)' offset='0.5'/><stop stop-color='rgba(197,255,8,1)' offset='1'/></radialGradient></defs></svg>"
            )}")`,
            backgroundSize: 'cover',
            borderRadius: '210px',
          }}
        />
        <div className="relative z-[1] max-w-xl flex-1 py-2">
          <p className={cn(j, 'text-[#3f5b22] text-xs sm:text-sm')}>{t('finalCtaLabel')}</p>
          <h2
            className={cn(
              b,
              'mt-1 text-balance text-[#111] text-[2.2rem] font-extrabold leading-tight sm:mt-2 sm:text-5xl sm:leading-tight md:text-6xl lg:text-7xl lg:leading-tight'
            )}
          >
            {t('finalCtaLine1')}
            <br />
            {t('finalCtaLine2')}
          </h2>
          <p
            className={cn(
              d,
              'mt-4 max-w-md text-pretty text-[#243818] text-base leading-7 sm:mt-6 sm:text-lg md:text-[1.05rem]'
            )}
          >
            {t('finalCtaP1')}
            <br />
            {t('finalCtaP2')}
          </p>
          <div className="mt-5 flex max-w-2xl flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center sm:gap-3.5">
            <Link
              href={`/${locale}/register`}
              className={cn(
                d,
                'inline-flex h-12 items-center justify-center rounded-full bg-[#111] px-5 text-sm font-semibold text-white no-underline sm:h-14 sm:px-6 sm:text-base',
                'hover:bg-[#0a0a0a] focus-visible:outline focus-visible:outline-2'
              )}
            >
              {t('finalCtaBtnPrimary')}
            </Link>
            <Link
              href={`/${locale}#branches`}
              className={cn(
                d,
                'inline-flex h-12 items-center justify-center rounded-full border-2 border-[#111] bg-transparent px-5 text-sm font-bold text-[#111] no-underline sm:h-14 sm:px-4 sm:text-base',
                'hover:bg-black/5'
              )}
            >
              {t('finalCtaBtnSecondary')}
            </Link>
          </div>
        </div>
        <div className="relative z-[1] flex flex-1 items-center justify-center pr-0 pt-6 sm:pt-0 lg:justify-end lg:pl-4">
          <FigmaImage
            src={CTA_PORTRAIT}
            width={513}
            height={513}
            className="h-auto w-full max-w-[14rem] rounded-3xl object-contain sm:max-w-xs lg:max-w-sm"
            alt=""
          />
        </div>
        <div className="absolute right-3 top-3 z-[0] size-20 rounded-3xl bg-[#111] opacity-90 sm:right-4 sm:top-4" />
      </div>
    </section>
  );
}
