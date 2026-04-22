'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
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
      <div className="space-y-6">
        <div
          className={`grid grid-cols-1 gap-6 ${
            isManager ? 'md:grid-cols-2' : 'md:grid-cols-3'
          }`}
        >
          <StatCard
            title={t('totalTeachers')}
            value={stats?.teachers.total || 0}
            change={{ value: '+4.5%', type: 'positive' }}
          />
          <StatCard
            title={t('activeTeachers')}
            value={stats?.teachers.active || 0}
            change={{ value: '+2.1%', type: 'positive' }}
          />
          {!isManager && (
            <StatCard
              title={t('pendingPayments')}
              value={stats?.finance.pendingPayments || 0}
              change={{
                value: stats?.finance.overduePayments
                  ? t('overdueCount', { count: stats.finance.overduePayments })
                  : t('allOnTime'),
                type: stats?.finance.overduePayments ? 'negative' : 'positive',
              }}
            />
          )}
        </div>

        {!isManager && <RevenueBlock />}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <UnpaidStudentsBlock />
          <AtRiskStudentsBlock />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GroupsWithCapacityBlock centerId={managerCenterId} />
          <BranchScheduleBlock centerId={managerCenterId} />
        </div>

        <PlannedAbsencesStaffBlock />
      </div>
    </DashboardLayout>
  );
}
