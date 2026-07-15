'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout';
import { AdminDashboardHero } from '@/features/admin-dashboard/AdminDashboardHero';
import {
  UnpaidStudentsBlock,
  GroupsWithCapacityBlock,
  AtRiskStudentsBlock,
  BranchScheduleBlock,
} from '@/features/dashboard';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { PlannedAbsencesStaffBlock } from '@/features/attendance';
import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { fetchCenter } from '@/features/centers/api/centers.api';
import { useIsIPad } from '@/shared/hooks/useIsIPad';

export default function AdminDashboardPage() {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const isIPad = useIsIPad();
  const [isDesktopUp, setIsDesktopUp] = useState(false);
  const { user } = useAuthStore();
  const isManager = user?.role === 'MANAGER';
  const managerCenterId =
    user?.role === 'MANAGER' ? user.managerCenterId ?? undefined : undefined;
  const { data: managerCenter } = useQuery({
    queryKey: ['center', managerCenterId],
    queryFn: () => fetchCenter(managerCenterId!),
    enabled: isManager && !!managerCenterId,
    staleTime: 5 * 60 * 1000,
  });

  const subtitle = isManager
    ? `${t('overview')} ${tNav('center')}: ${managerCenter?.name ?? '—'}`
    : t('overview');
  const isIPadProLayout = isIPad && isDesktopUp;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktopUp(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  return (
    <DashboardLayout title={t('title')} subtitle={subtitle}>
      <div className={portalPageStackClass}>
        <AdminDashboardHero isManager={isManager} />

        <div className="grid w-full min-w-0 grid-cols-1 gap-[clamp(0.75rem,1.5vw,1.5rem)] lg:grid-cols-2">
          {!isManager && <UnpaidStudentsBlock />}
          <AtRiskStudentsBlock />
        </div>

        <div
          className={`grid w-full min-w-0 grid-cols-1 gap-[clamp(0.75rem,1.5vw,1.5rem)] ${
            isIPadProLayout ? '' : 'lg:grid-cols-2'
          }`}
        >
          <GroupsWithCapacityBlock centerId={managerCenterId} />
          <BranchScheduleBlock centerId={managerCenterId} />
        </div>

        <PlannedAbsencesStaffBlock />
      </div>
    </DashboardLayout>
  );
}
