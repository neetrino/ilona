'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { HomeShell, HOME_SHELL_INNER_X_CLASS } from './home-shell';
import { heroTitleFont } from './hero-section.font';
import '../styles/home.css';

export function HeroSection() {
  const t = useTranslations('home');
  const locale = useLocale();
  const homeBase = `/home/${locale}`;
  const registerHref = `/${locale}/register`;
  const branchesHref = `${homeBase}#branches`;

  return (
    <section
      id="home"
      className="home-hero overflow-x-hidden bg-white"
      aria-labelledby="home-hero-title"
    >
      <HomeShell
        className="pb-10 pt-4 sm:pb-14 sm:pt-5 md:pb-16 lg:pb-[5.5rem] lg:pt-[clamp(2rem,5vw,4.5rem)]"
      >
        <div className={cn(HOME_SHELL_INNER_X_CLASS, 'home-hero-grid')}>
          <div className="home-hero-copy">
            <h1
              id="home-hero-title"
              className={cn(heroTitleFont.className, 'home-hero-title')}
            >
              <span className="block">{t('heroTitleLine1')}</span>
              <span className="block">{t('heroTitleLine2')}</span>
            </h1>

            <p className="home-hero-description">{t('heroDescription')}</p>

            <div className="home-hero-actions">
              <Link
                href={registerHref}
                className="home-hero-btn-register transition-colors hover:bg-slate-50 active:bg-slate-100"
              >
                {t('registerNow')}
              </Link>
              <Link
                href={branchesHref}
                className="home-hero-btn-branch transition-colors hover:bg-[#1447e6]/5 active:bg-[#1447e6]/10"
              >
                {t('chooseBranch')}
              </Link>
            </div>
          </div>

          <div className="home-hero-visual">
            <div className="home-hero-stage">
              <div className="home-hero-flag-us relative" aria-hidden>
                <Image
                  src="/home/hero-flag-us.png"
                  alt=""
                  fill
                  sizes="(max-width: 1023px) 45vw, 281px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="home-hero-flag-uk relative" aria-hidden>
                <Image
                  src="/home/hero-flag-uk.png"
                  alt=""
                  fill
                  sizes="(max-width: 1023px) 48vw, 290px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="home-hero-character relative" aria-hidden>
                <Image
                  src="/home/hero-character.png"
                  alt=""
                  fill
                  sizes="(max-width: 1023px) 72vw, 393px"
                  className="object-contain object-top"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </HomeShell>
    </section>
  );
}
