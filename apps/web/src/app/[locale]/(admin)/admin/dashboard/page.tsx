'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout';
import { AdminDashboardHero } from '@/features/admin-dashboard/AdminDashboardHero';
import {
  useAdminDashboardStats,
  UnpaidStudentsBlock,
  GroupsWithCapacityBlock,
  AtRiskStudentsBlock,
  RevenueBlock,
  BranchScheduleBlock,
} from '@/features/dashboard';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { PlannedAbsencesStaffBlock } from '@/features/attendance';
import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { fetchCenter } from '@/features/centers/api/centers.api';

export default function AdminDashboardPage() {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
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

  const { data: stats, error: statsError } = useAdminDashboardStats({
    includeFinance: !isManager,
  });

  if (statsError) {
    console.error('Dashboard error:', statsError);
  }

  const subtitle = isManager
    ? `${t('overview')} ${tNav('center')}: ${managerCenter?.name ?? '—'}`
    : t('overview');

  return (
    <DashboardLayout title={t('title')} subtitle={subtitle}>
      <div className={portalPageStackClass}>
        <AdminDashboardHero
          studentsTotal={stats?.students.total ?? 0}
          teachersTotal={stats?.teachers.total ?? 0}
          groupsTotal={stats?.groups.total ?? 0}
          isManager={isManager}
        />

        {!isManager && <RevenueBlock />}

        <div className="grid w-full min-w-0 grid-cols-1 gap-[clamp(0.75rem,1.5vw,1.5rem)] lg:grid-cols-2">
          <UnpaidStudentsBlock />
          <AtRiskStudentsBlock />
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-[clamp(0.75rem,1.5vw,1.5rem)] lg:grid-cols-2">
          <GroupsWithCapacityBlock centerId={managerCenterId} />
          <BranchScheduleBlock centerId={managerCenterId} />
        </div>

        <PlannedAbsencesStaffBlock />
      </div>
    </DashboardLayout>
  );
}
