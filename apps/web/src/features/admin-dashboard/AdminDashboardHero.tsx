'use client';

import { useTranslations } from 'next-intl';
import { PublicAssetImage } from '@/shared/components/ui';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import { useDashboardBanner } from '@/features/settings';
import { getFullApiUrl } from '@/shared/lib/api-url-utils';

type AdminDashboardHeroProps = {
  isManager: boolean;
};

export function AdminDashboardHero({
  isManager,
}: AdminDashboardHeroProps) {
  const t = useTranslations('dashboard');
  const { data: dashboardBannerData } = useDashboardBanner();
  const customBannerUrl = getFullApiUrl(dashboardBannerData?.bannerUrl);
  const bannerImageSrc = customBannerUrl ?? STUDENT_DASHBOARD_ASSETS.heroIllustration;
  const bannerImageClass = customBannerUrl
    ? 'h-full w-full object-contain'
    : 'h-auto w-full -translate-x-2 translate-y-2 scale-[1.08] rotate-90 object-contain sm:-translate-x-6 sm:translate-y-4 sm:scale-[1.2] lg:translate-x-0 lg:translate-y-8 lg:scale-[1.6]';

  return (
    <section className="relative min-h-[20rem] overflow-hidden rounded-[1.75rem] bg-[#1010a3] text-white sm:min-h-[22rem] lg:min-h-[24rem]">
      <div className="relative z-10 flex flex-col gap-6 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between lg:gap-14 lg:p-14">
        <div className="min-w-0 max-w-2xl flex-1 lg:max-w-[48%]">
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#f7f7f5]">
            {isManager ? t('banner.managerTitle') : t('banner.adminTitle')}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#b9b9bd] sm:text-[0.875rem]">
            {isManager ? t('banner.managerSubtitle') : t('banner.adminSubtitle')}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[16rem] shrink-0 sm:max-w-[18rem] lg:mx-0 lg:ml-auto lg:max-w-[22rem] lg:pl-10">
          <PublicAssetImage
            src={bannerImageSrc}
            alt=""
            width={460}
            height={445}
            className={bannerImageClass}
            priority
          />
        </div>
      </div>
    </section>
  );
}
