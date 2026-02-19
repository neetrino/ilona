'use client';

import { StatCard } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/lib/utils';

interface StudentsStatsProps {
  totalStudents: number;
  activeStudents: number;
  studentsWithGroup: number;
  totalFees: number;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function StudentsStats({ 
  totalStudents, 
  activeStudents, 
  studentsWithGroup, 
  totalFees,
  t 
}: StudentsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

