'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { bricolageDisplay, dmSansHome, jetbrainsMono } from '@/shared/components/home/home-fonts';
import { cn } from '@/shared/lib/utils';
import { locales, type Locale } from '@/config/i18n';

const b = bricolageDisplay.className;
const d = dmSansHome.className;
const jm = jetbrainsMono.className;

const LOCALE_STORAGE = 'preferred-locale';

function switchLocale(
  newLocale: Locale,
  currentPath: string,
  router: ReturnType<typeof useRouter>
) {
  if (newLocale) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE, newLocale);
    }
  }
  const seg = currentPath.split('/');
  if (seg[1] && (locales as readonly string[]).includes(seg[1] ?? '')) {
    seg[1] = newLocale;
  } else {
    seg.splice(1, 0, newLocale);
  }
  router.push(seg.join('/'));
  router.refresh();
}

export function HomeSiteFooter() {
  const t = useTranslations('home');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <footer
      className="mx-auto w-full max-w-[1920px] border-[#e7e3d9] border-t px-4 py-10 sm:px-10 sm:py-12"
      id="footer"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-12">
        <div className="max-w-sm">
          <div
            className={cn(
              b,
              'inline-flex h-[54px] max-w-md items-center rounded-full bg-[#f4f1ea] pl-3.5 pr-5'
            )}
          >
            <div className="relative mr-2.5 h-7 w-7 shrink-0 rounded-[14px] bg-[#111]">
              <div className="absolute bottom-1 left-0.5 h-2.5 w-2.5 rounded-sm bg-[#b8e986]" />
            </div>
            <span className="text-[#111] text-lg font-bold">{t('wordmark')}</span>
          </div>
          <p className={cn(d, 'mt-4 text-[#4a4a4a] text-[15px] leading-6 sm:mt-5 sm:text-base sm:leading-6')}>
            {t('footerBlurb1')}
            <br />
            {t('footerBlurb2')}{' '}
            {t('footerBlurb3')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10 lg:max-w-xl lg:flex-1">
          <div>
            <p className={cn(b, 'text-[#8a8680] text-sm font-semibold')}>
              {t('footerGroupCenter')}
            </p>
            <ul className="mt-3 space-y-2.5 sm:mt-4">
              <li>
                <a href="#about" className={cn(d, 'text-[#4a4a4a] text-[15px] no-underline')}>
                  {t('footerLinkAbout')}
                </a>
              </li>
              <li>
                <a href="#branches" className={cn(d, 'text-[#4a4a4a] text-[15px] no-underline')}>
                  {t('footerLinkBranches')}
                </a>
              </li>
              <li>
                <a href="#student-life" className={cn(d, 'text-[#4a4a4a] text-[15px] no-underline')}>
                  {t('footerLinkStudentLife')}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className={cn(b, 'text-[#8a8680] text-sm font-semibold')}>
              {t('footerGroupPlatform')}
            </p>
            <ul className="mt-3 space-y-2.5 sm:mt-4">
              <li>
                <a href="#platform" className={cn(d, 'text-[#4a4a4a] text-[15px] no-underline')}>
                  {t('footerLinkFeatures')}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className={cn(d, 'text-[#4a4a4a] text-[15px] no-underline')}>
                  {t('footerLinkHow')}
                </a>
              </li>
              <li>
                <Link
                  href={`/${locale}/register`}
                  className={cn(d, 'text-[#4a4a4a] text-[15px] no-underline')}
                >
                  {t('footerLinkSignUp')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className={cn(b, 'text-[#8a8680] text-sm font-semibold')}>
              {t('footerGroupContact')}
            </p>
            <ul className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
              <li>
                <span className={cn(d, 'text-[#4a4a4a] text-[15px]')}>
                  {t('footerLinkAddr1')}
                </span>
              </li>
              <li>
                <span className={cn(d, 'text-[#4a4a4a] text-[15px]')}>
                  {t('footerLinkAddr2')}
                </span>
              </li>
              <li>
                <span className={cn(d, 'text-[#4a4a4a] text-[15px]')}>
                  {t('footerLinkAddr3')}
                </span>
              </li>
              <li>
                <span className={cn(d, 'text-[#4a4a4a] text-[15px]')}>
                  {t('footerLinkAddr4')}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col flex-wrap items-start justify-between gap-3 border-[#e7e3d9] border-t pt-6 sm:mt-10 sm:flex-row sm:items-center">
        <p className={cn(d, 'text-[#8a8680] text-xs sm:text-sm')}>
          {t('footerCopyright')}
        </p>
        <p className={cn(jm, 'flex flex-wrap items-center gap-x-1 text-[#8a8680] text-xs sm:text-sm')}>
          <span>{t('footerMadeWith')}</span>
          <span aria-hidden>·</span>
          {locales.map((loc, i) => (
            <span key={loc} className="inline-flex items-center">
              {i > 0 ? <span className="px-0.5">/</span> : null}
              <button
                type="button"
                onClick={() => {
                  if (loc !== (locale as Locale)) {
                    switchLocale(loc, pathname, router);
                  }
                }}
                className={cn(
                  'cursor-pointer border-none bg-transparent p-0.5',
                  (locale as Locale) === loc
                    ? 'font-bold text-[#4a4a4a] underline'
                    : 'text-[#8a8680] hover:underline',
                  d
                )}
              >
                {loc === 'en' ? 'EN' : 'HY'}
              </button>
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
