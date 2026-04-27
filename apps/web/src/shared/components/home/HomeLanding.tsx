'use client';

import { homeFontClassName } from '@/shared/components/home/home-fonts';
import { HomeBentoStrip } from '@/shared/components/home/HomeBentoStrip';
import { HomeFinalCta } from '@/shared/components/home/HomeFinalCta';
import { HomeHero } from '@/shared/components/home/HomeHero';
import { HomeHowItWorks } from '@/shared/components/home/HomeHowItWorks';
import { HomeLearnWithUs } from '@/shared/components/home/HomeLearnWithUs';
import { HomeLocationsGrid } from '@/shared/components/home/HomeLocationsGrid';
import { HomePlatformGrid } from '@/shared/components/home/HomePlatformGrid';
import { HomeSiteFooter } from '@/shared/components/home/HomeSiteFooter';
import { HomeStudentLife } from '@/shared/components/home/HomeStudentLife';
import { cn } from '@/shared/lib/utils';

export function HomeLanding() {
  return (
    <div className={cn('bg-white text-[#111]', homeFontClassName)}>
      <HomeHero />
      <HomeBentoStrip />
      <HomeLearnWithUs />
      <HomeLocationsGrid />
      <HomePlatformGrid />
      <HomeStudentLife />
      <HomeHowItWorks />
      <HomeFinalCta />
      <HomeSiteFooter />
    </div>
  );
}
