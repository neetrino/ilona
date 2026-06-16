'use client';

import { StatCard } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/lib/utils';

interface StudentsStatsProps {
  totalStudents: number;
  activeStudents: number;
  studentsWithGroup: number;
  totalFees: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function StudentsStats({ 
  totalStudents, 
  activeStudents, 
  studentsWithGroup, 
  totalFees,
  t 
}: StudentsStatsProps) {
  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      <StatCard
        title={t('totalStudents')}
        value={totalStudents}
        change={{ value: '+5.2%', type: 'positive' }}
      />
      <StatCard
        title={t('activeStudents')}
        value={activeStudents || totalStudents}
        change={{ value: '+3.1%', type: 'positive' }}
      />
      <StatCard
        title={t('inGroups')}
        value={studentsWithGroup}
        change={{ 
          value: t('unassignedCount', { count: totalStudents - studentsWithGroup }), 
          type: totalStudents - studentsWithGroup > 0 ? 'warning' : 'positive' 
        }}
      />
      <StatCard
        title={t('totalMonthlyFees')}
        value={formatCurrency(totalFees)}
      />
    </div>
  );
}

