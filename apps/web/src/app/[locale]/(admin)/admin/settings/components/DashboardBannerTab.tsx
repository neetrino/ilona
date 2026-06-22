'use client';

import { DashboardBannerImageSection } from './DashboardBannerImageSection';
import { DashboardBannerTextSection } from './DashboardBannerTextSection';

export function DashboardBannerTab() {
  return (
    <div className="space-y-6">
      <DashboardBannerTextSection />
      <DashboardBannerImageSection />
    </div>
  );
}
