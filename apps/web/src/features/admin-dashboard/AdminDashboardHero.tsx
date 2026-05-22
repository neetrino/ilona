'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { PublicAssetImage } from '@/shared/components/ui';
import { formatLocaleInteger } from '@/shared/lib/utils';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';

type AdminDashboardHeroProps = {
  studentsTotal: number;
  teachersTotal: number;
  groupsTotal: number;
  isManager: boolean;
};

type HeroStatProps = {
  label: string;
  value: string;
};

function HeroStat({ label, value }: HeroStatProps) {
  return (
    <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
      <p className="text-[0.6875rem] uppercase tracking-[0.08em] text-[#c8c8ec]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export function AdminDashboardHero({
  studentsTotal,
  teachersTotal,
  groupsTotal,
  isManager,
}: AdminDashboardHeroProps) {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#1010a3] text-white">
      <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:p-10">
        <div className="min-w-0 max-w-2xl flex-1">
          <p className="text-[0.6875rem] font-normal uppercase tracking-[0.18em] text-[#9b9b9f]">
            {t('title')}
          </p>
          <h2 className="mt-2 text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#f7f7f5]">
            {isManager ? t('banner.managerTitle') : t('banner.adminTitle')}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#b9b9bd] sm:text-[0.875rem]">
            {isManager ? t('banner.managerSubtitle') : t('banner.adminSubtitle')}
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <HeroStat
              label={t('banner.statStudents')}
              value={formatLocaleInteger(studentsTotal, locale)}
            />
            <HeroStat
              label={t('banner.statTeachers')}
              value={formatLocaleInteger(teachersTotal, locale)}
            />
            <HeroStat label={t('totalGroups')} value={formatLocaleInteger(groupsTotal, locale)} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/admin/students`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white pl-4 pr-1.5 text-[0.8125rem] font-medium text-[#1010a3] transition-opacity hover:opacity-90"
            >
              {tNav('students')}
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
            <Link
              href={`/${locale}/admin/teachers`}
              className="inline-flex h-10 items-center rounded-full border border-white/70 px-4 text-[0.8125rem] text-[#f7f7f5] transition-colors hover:bg-white/10"
            >
              {tNav('teachers')}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[12rem] shrink-0 sm:max-w-[14rem] lg:mx-0 lg:ml-20 lg:max-w-[18rem]">
          <PublicAssetImage
            src={STUDENT_DASHBOARD_ASSETS.heroIllustration}
            alt=""
            width={460}
            height={445}
            className="h-auto w-full -translate-x-2 translate-y-2 scale-[1.08] rotate-90 object-contain sm:-translate-x-6 sm:translate-y-4 sm:scale-[1.2] lg:-translate-x-20 lg:translate-y-8 lg:scale-[1.6]"
            priority
          />
        </div>
      </div>
    </section>
  );
}
