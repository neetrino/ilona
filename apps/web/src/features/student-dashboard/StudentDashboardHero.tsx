'use client';

import { PublicAssetImage } from '@/shared/components/ui';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { STUDENT_DASHBOARD_ASSETS } from './assets';

type StudentDashboardHeroProps = {
  streakDays: number;
  levelLabel?: string;
  resumeTopic?: string;
};

function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / 86_400_000 + start.getDay() + 1) / 7);
}

function getWeekdayLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { weekday: 'long' });
}

export function StudentDashboardHero({
  streakDays,
  levelLabel,
  resumeTopic,
}: StudentDashboardHeroProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const now = new Date();
  const week = getWeekOfYear(now);
  const dayName = getWeekdayLabel(now, locale);

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#1010a3] text-white">
      <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:p-10">
        <div className="min-w-0 max-w-2xl flex-1">
          <p className="text-[0.6875rem] font-normal uppercase tracking-[0.18em] text-[#9b9b9f]">
            {t('hero.weekLabel', { day: dayName, week })}
          </p>
          <h2 className="mt-2 text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.04em]">
            <span className="text-[#f7f7f5]">{t('banner.studentTitle')}</span>
            <span className="block text-white">{t('hero.titleAccent')}</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#b9b9bd] sm:text-[0.875rem]">
            {t('hero.streakDescription', {
              count: streakDays,
              level: levelLabel ?? t('progress.trackDefault'),
            })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/student/schedule`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white pl-4 pr-1.5 text-[0.8125rem] font-medium text-[#1010a3] transition-opacity hover:opacity-90"
            >
              {t('hero.continueLearning')}
              <span className="flex h-[1.8125rem] w-[1.8125rem] items-center justify-center rounded-[0.875rem] bg-[#1010a3]">
                <PublicAssetImage
                  src={STUDENT_DASHBOARD_ASSETS.arrowHero}
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
              </span>
            </Link>
            {resumeTopic ? (
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-full border border-white/70 px-4 text-[0.8125rem] text-[#f7f7f5] transition-colors hover:bg-white/10"
              >
                {t('hero.resumeLesson', { topic: resumeTopic })}
              </button>
            ) : null}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[17rem] shrink-0 sm:max-w-xs lg:mx-0 lg:max-w-[18rem]">
          <PublicAssetImage
            src={STUDENT_DASHBOARD_ASSETS.heroIllustration}
            alt=""
            width={460}
            height={445}
            className="h-auto w-full object-contain"
            priority
          />
        </div>
      </div>
    </section>
  );
}
