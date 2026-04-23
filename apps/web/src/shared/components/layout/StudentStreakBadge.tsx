'use client';

import { Flame } from 'lucide-react';
import { useMyDashboard } from '@/features/students';

export function StudentStreakBadge() {
  const { data } = useMyDashboard(true);
  const currentStreak = data?.statistics?.attendance?.currentStreak ?? 0;

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-orange-200/80 bg-gradient-to-r from-orange-50 to-amber-50 px-2.5 py-2 shadow-sm">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600 ring-1 ring-orange-200">
        <Flame className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-1 text-orange-800">
        <span className="text-lg font-extrabold leading-none">{currentStreak}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-600">
          {currentStreak === 1 ? 'day' : 'days'}
        </span>
      </div>
    </div>
  );
}
