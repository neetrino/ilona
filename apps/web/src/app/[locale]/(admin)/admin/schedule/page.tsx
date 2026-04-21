'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { ScheduleGrid } from '@/features/schedule/ScheduleGrid';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function AdminSchedulePage() {
  const t = useTranslations('nav');
  const { user } = useAuthStore();
  const managerCenterId =
    user?.role === 'MANAGER' ? user.managerCenterId : undefined;

  const [centerId, setCenterId] = useState<string>('');

  const { data: centersData } = useCenters({ isActive: true });
  const allCenters = centersData?.items ?? [];
  const visibleCenters = managerCenterId
    ? allCenters.filter((c) => c.id === managerCenterId)
    : allCenters;

  const effectiveCenterId = managerCenterId ?? (centerId || undefined);

  const { data: groupsData, isLoading } = useGroups({
    isActive: true,
    take: 200,
    centerId: effectiveCenterId,
  });

  const groups = useMemo(() => groupsData?.items ?? [], [groupsData?.items]);

  return (
    <DashboardLayout
      title={t('schedule')}
      subtitle="Weekly schedule grid for all active groups"
    >
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        {!managerCenterId && (
          <div className="md:w-72">
            <label
              htmlFor="schedule-center"
              className="block text-sm font-medium text-slate-600 mb-1.5"
            >
              Center
            </label>
            <select
              id="schedule-center"
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">All centers</option>
              {visibleCenters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex-1 text-sm text-slate-500">
          Showing {groups.length} active group{groups.length !== 1 ? 's' : ''}
          {effectiveCenterId
            ? ` in ${
                visibleCenters.find((c) => c.id === effectiveCenterId)?.name ??
                'selected center'
              }`
            : ''}
          .
        </div>
      </div>

      <ScheduleGrid groups={groups} isLoading={isLoading} />
    </DashboardLayout>
  );
}
