'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { HomeShell, HOME_SHELL_INNER_X_CLASS } from './home-shell';
import { aboutHeadingFont } from './about-section.font';

export function AboutSection() {
  const t = useTranslations('home');

  return (
    <section
      id="about"
      className="home-about"
      aria-labelledby="home-about-title"
    >
      <HomeShell className="home-about-shell">
        <div className={cn(HOME_SHELL_INNER_X_CLASS, 'home-about-grid')}>
          <div className="home-about-visual" aria-hidden>
            <div className="home-about-stage">
              <span className="home-about-badge home-about-badge-since">
                {t('aboutSectionSince')}
              </span>
              <div className="home-about-tower">
                <Image
                  src="/home/about/big-ben.png"
                  alt=""
                  fill
                  sizes="(max-width: 1023px) 85vw, 36vw"
                  className="home-about-tower-img"
                  priority={false}
                />
              </div>
              <span className="home-about-badge home-about-badge-years">
                {t('aboutSectionYears')}
              </span>
              <div className="home-about-flag">
                <Image
                  src="/home/about/flag-uk-sticker.png"
                  alt=""
                  fill
                  sizes="(max-width: 1023px) 55vw, 23vw"
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          <div className="home-about-content">
            <p className="home-about-eyebrow">{t('aboutSectionEyebrow')}</p>

            <h2
              id="home-about-title"
              className={cn(aboutHeadingFont.className, 'home-about-title')}
            >
              {t('aboutSectionTitle')}
            </h2>

            <p className="home-about-paragraph">{t('aboutSectionParagraph1')}</p>
            <p className="home-about-paragraph">{t('aboutSectionParagraph2')}</p>

            <div className="home-about-stats">
              <article className="home-about-stat-card">
                <img
                  src="/home/about/icon-trophy.svg"
                  alt=""
                  className="home-about-stat-icon"
                  aria-hidden
                />
                <p className="home-about-stat-value">{t('aboutSectionStatSuccess')}</p>
                <p className="home-about-stat-label">{t('aboutSectionStatSuccessLabel')}</p>
              </article>
              <article className="home-about-stat-card">
                <img
                  src="/home/about/icon-target.svg"
                  alt=""
                  className="home-about-stat-icon"
                  aria-hidden
                />
                <p className="home-about-stat-value">{t('aboutSectionStatBranches')}</p>
                <p className="home-about-stat-label">{t('aboutSectionStatBranchesLabel')}</p>
              </article>
            </div>
          </div>
        </div>
      </HomeShell>
    </section>
  );
}
