'use client';

import { StatCard } from '@/shared/components/ui';
import type { GroupsTabState } from './useGroupsTab';

interface GroupsStatsGridProps {
  showBoardCenterPicker: boolean;
  allCentersCount: number;
  totalGroupsAcrossCenters: number;
  totalGroups: number;
  activeGroups: number;
  totalStudentsInGroups: number;
  averageGroupSize: number;
  t: GroupsTabState['t'];
}

export function GroupsStatsGrid({
  showBoardCenterPicker,
  allCentersCount,
  totalGroupsAcrossCenters,
  totalGroups,
  activeGroups,
  totalStudentsInGroups,
  averageGroupSize,
  t,
}: GroupsStatsGridProps) {
  if (showBoardCenterPicker) {
    return (
      <>
        <StatCard title={t('centers')} value={allCentersCount} />
        <StatCard
          title={t('totalGroups')}
          value={totalGroupsAcrossCenters}
          change={{ value: t('acrossAllCenters'), type: 'neutral' }}
        />
        <StatCard
          title={t('studentsEnrolled')}
          value="—"
          change={{ value: t('openACenter'), type: 'neutral' }}
        />
        <StatCard
          title={t('avgGroupSize')}
          value="—"
          change={{ value: t('perCenterView'), type: 'neutral' }}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-2">
        <StatCard title={t('totalGroups')} value={totalGroups} />
        <StatCard
          title={t('activeGroups')}
          value={activeGroups || totalGroups}
          change={{ value: t('currentlyRunning'), type: 'positive' }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-2">
        <StatCard title={t('studentsEnrolled')} value={totalStudentsInGroups} />
        <StatCard
          title={t('avgGroupSize')}
          value={averageGroupSize}
          change={{ value: t('studentsPerGroup'), type: 'neutral' }}
        />
      </div>
    </>
  );
}
