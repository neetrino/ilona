'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, StatCard } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/lib/utils';

interface StudentsStatsProps {
  totalStudents: number;
  activeStudents: number;
  studentsWithGroup: number;
  totalFees: number;
  /** Hide fee total for Manager portal */
  showTotalMonthlyFees?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function StudentsStats({ 
  totalStudents, 
  activeStudents, 
  studentsWithGroup, 
  totalFees,
  showTotalMonthlyFees = true,
  t 
}: StudentsStatsProps) {
  const [selectedStatKey, setSelectedStatKey] = useState<null | 'totalStudents' | 'activeStudents' | 'inGroups' | 'totalMonthlyFees'>(null);

  const statItems: Array<{
    key: 'totalStudents' | 'activeStudents' | 'inGroups' | 'totalMonthlyFees';
    title: string;
    value: string | number;
    change?: { value: string; type: 'positive' | 'negative' | 'neutral' | 'warning' };
  }> = [
    {
      key: 'totalStudents',
      title: t('totalStudents'),
      value: totalStudents,
      change: { value: '+5.2%', type: 'positive' },
    },
    {
      key: 'activeStudents',
      title: t('activeStudents'),
      value: activeStudents || totalStudents,
      change: { value: '+3.1%', type: 'positive' },
    },
    {
      key: 'inGroups',
      title: t('inGroups'),
      value: studentsWithGroup,
      change: {
        value: t('unassignedCount', { count: totalStudents - studentsWithGroup }),
        type: totalStudents - studentsWithGroup > 0 ? 'warning' : 'positive',
      },
    },
    ...(showTotalMonthlyFees
      ? [
          {
            key: 'totalMonthlyFees' as const,
            title: t('totalMonthlyFees'),
            value: formatCurrency(totalFees),
          },
        ]
      : []),
  ];

  const selectedStat = statItems.find((item) => item.key === selectedStatKey) ?? null;

  return (
    <>
      <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:hidden">
        {statItems.map((item) => (
          <Button
            key={item.key}
            type="button"
            variant="outline"
            className="h-auto w-full flex-col items-start justify-start rounded-2xl border-[rgba(14,14,16,0.07)] bg-white p-4 text-left hover:bg-white"
            onClick={() => setSelectedStatKey(item.key)}
          >
            <p className="truncate text-xs tracking-wide text-[#8b8b90]">{item.title}</p>
            <p className="mt-2 break-words text-lg font-bold leading-tight tracking-tight text-[#1010a3]">{item.value}</p>
            {item.change ? (
              <span
                className={`mt-2 inline-flex self-start whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
                  item.change.type === 'positive'
                    ? 'bg-[#d9f4e8] text-[#0d6b42]'
                    : item.change.type === 'negative'
                      ? 'bg-[#ffe5e3] text-[#ff2e23]'
                      : item.change.type === 'warning'
                        ? 'bg-[#ffeb8c] text-[#3a2f00]'
                        : 'bg-[#f6f6f7] text-[#3b3b40]'
                }`}
              >
                {item.change.value}
              </span>
            ) : null}
          </Button>
        ))}
      </div>

      <div
        className={
          showTotalMonthlyFees
            ? 'hidden w-full min-w-0 grid-cols-2 gap-4 sm:grid lg:grid-cols-4 lg:gap-6'
            : 'hidden w-full min-w-0 grid-cols-2 gap-4 sm:grid lg:grid-cols-3 lg:gap-6'
        }
      >
        {statItems.map((item) => (
          <StatCard
            key={item.key}
            title={item.title}
            value={item.value}
            change={item.change}
            className={item.key === 'inGroups' || item.key === 'totalMonthlyFees' ? 'col-span-2 sm:col-span-1' : undefined}
          />
        ))}
      </div>

      <Dialog open={selectedStat !== null} onOpenChange={(open) => !open && setSelectedStatKey(null)}>
        <DialogContent
          className="top-auto bottom-0 left-0 right-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-2xl border border-[rgba(14,14,16,0.07)] bg-white p-4 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:hidden"
          overlayClassName="fixed inset-0 z-50 bg-black/40"
        >
          {selectedStat ? (
            <DialogHeader className="mb-3 text-left">
              <DialogTitle className="text-base font-semibold text-[#0e0e10]">{selectedStat.title}</DialogTitle>
            </DialogHeader>
          ) : null}
          {selectedStat ? (
            <StatCard
              title={selectedStat.title}
              value={selectedStat.value}
              change={selectedStat.change}
              className="border-[rgba(14,14,16,0.07)]"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

