'use client';

import { PublicAssetImage } from '@/shared/components/ui';
import { useTranslations } from 'next-intl';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';

export function TeacherDashboardHero() {
  const t = useTranslations('dashboard');

  return (
    <section className="relative min-h-[20rem] overflow-hidden rounded-[1.75rem] bg-[#1010a3] text-white sm:min-h-[22rem] lg:min-h-[24rem]">
      <div className="relative z-10 flex flex-col gap-6 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between lg:gap-14 lg:p-14">
        <div className="min-w-0 max-w-2xl flex-1 lg:max-w-[48%]">
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.04em]">
            <span className="text-[#f7f7f5]">{t('banner.teacherTitle')}</span>
            <span className="block text-white">{t('teacherHero.titleAccent')}</span>
          </h2>
        </div>
        <div className="relative mx-auto w-full max-w-[16rem] shrink-0 sm:max-w-[18rem] lg:mx-0 lg:ml-auto lg:max-w-[22rem] lg:pl-10">
          <PublicAssetImage
            src={STUDENT_DASHBOARD_ASSETS.heroIllustration}
            alt=""
            width={460}
            height={445}
            className="h-auto w-full -translate-x-2 translate-y-2 scale-[1.08] rotate-90 object-contain sm:-translate-x-6 sm:translate-y-4 sm:scale-[1.2] lg:translate-x-0 lg:translate-y-8 lg:scale-[1.6]"
            priority
          />
        </div>
      </div>
    </section>
  );
}
