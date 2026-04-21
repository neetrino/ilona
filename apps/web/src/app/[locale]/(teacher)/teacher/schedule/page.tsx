'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import { ScheduleGrid } from '@/features/schedule/ScheduleGrid';

export default function TeacherSchedulePage() {
  const t = useTranslations('nav');
  const { data: groups, isLoading } = useMyGroups();
  const groupsList = useMemo(() => groups ?? [], [groups]);

  return (
    <DashboardLayout
      title={t('schedule')}
      subtitle="Weekly schedule across the groups you teach"
    >
      <div className="text-sm text-slate-500 mb-4">
        Showing {groupsList.length} group{groupsList.length !== 1 ? 's' : ''} with
        configured schedules.
      </div>
      <ScheduleGrid groups={groupsList} isLoading={isLoading} />
    </DashboardLayout>
  );
}
