'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout, DashboardPromoBanner } from '@/shared/components/layout';
import { formatLocaleInteger } from '@/shared/lib/utils';
import { StatCard } from '@/shared/components/ui';
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
  const locale = useLocale();
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

  const promoBanner = (
    <DashboardPromoBanner
      title={isManager ? t('banner.managerTitle') : t('banner.adminTitle')}
      subtitle={isManager ? t('banner.managerSubtitle') : t('banner.adminSubtitle')}
      primaryStat={{
        label: t('banner.statStudents'),
        value: stats
          ? formatLocaleInteger(stats.students.total, locale)
          : t('banner.statValueLoading'),
      }}
      secondaryStat={{
        label: t('banner.statTeachers'),
        value: stats
          ? formatLocaleInteger(stats.teachers.total, locale)
          : t('banner.statValueLoading'),
      }}
    />
  );

  return (
    <DashboardLayout title={t('title')} subtitle={subtitle} promoBanner={promoBanner}>
      <div className={portalPageStackClass}>
        <div className="grid w-full min-w-0 grid-cols-1 gap-[clamp(0.75rem,1.5vw,1.5rem)] sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title={t('totalTeachers')}
            value={stats?.teachers.total || 0}
            change={{ value: '+4.5%', type: 'positive' }}
          />
          <StatCard
            title={t('totalStudents')}
            value={stats?.students.total || 0}
          />
          <StatCard title={t('totalGroups')} value={stats?.groups.total || 0} />
        </div>

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
