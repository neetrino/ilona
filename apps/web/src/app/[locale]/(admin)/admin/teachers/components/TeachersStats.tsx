'use client';

import { StatCard } from '@/shared/components/ui';

interface TeachersStatsProps {
  totalTeachers: number;
  activeTeachers: number;
  t: (key: string) => string;
}

export function TeachersStats({ totalTeachers, activeTeachers, t }: TeachersStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <StatCard
        title={t('totalTeachers')}
        value={totalTeachers}
        change={{ value: '+4.5%', type: 'positive' }}
      />
      <StatCard
        title={t('activeTeachers')}
        value={activeTeachers || totalTeachers}
        change={{ value: '+2.1%', type: 'positive' }}
      />
    </div>
  );
}

