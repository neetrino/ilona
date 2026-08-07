'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDailyPlans } from '@/features/daily-plan';
import { DailyPlanCard } from '@/features/daily-plan/DailyPlanCard';
import { DailyPlanViewer } from '@/features/daily-plan/DailyPlanViewer';
import type { DailyPlan, DailyPlanResourceKind } from '@/features/daily-plan/types';
import { GROUP_DETAIL_DAILY_PLANS_TAKE } from './group-detail.constants';

interface GroupDetailDailyPlansTabProps {
  groupId: string;
}

export function GroupDetailDailyPlansTab({ groupId }: GroupDetailDailyPlansTabProps) {
  const t = useTranslations('groups');
  const tDaily = useTranslations('dailyPlanPage');
  const [viewing, setViewing] = useState<DailyPlan | null>(null);

  const { data, isLoading, isError, error } = useDailyPlans({
    groupId,
    take: GROUP_DETAIL_DAILY_PLANS_TAKE,
  });

  const kindLabel = useMemo(
    (): Record<DailyPlanResourceKind, string> => ({
      READING: tDaily('resourceKinds.READING'),
      LISTENING: tDaily('resourceKinds.LISTENING'),
      WRITING: tDaily('resourceKinds.WRITING'),
      SPEAKING: tDaily('resourceKinds.SPEAKING'),
      GRAMMAR: tDaily('resourceKinds.GRAMMAR'),
      CHALLENGE: tDaily('resourceKinds.CHALLENGE'),
    }),
    [tDaily],
  );

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="min-h-[16rem] animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-600">
        {error instanceof Error ? error.message : tDaily('loadError')}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white px-4 py-10 text-center text-sm text-[#8b8b90]">
        {t('detailNoDailyPlans')}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        {items.map((plan) => (
          <DailyPlanCard
            key={plan.id}
            plan={plan}
            kindLabel={kindLabel}
            onView={() => setViewing(plan)}
            onEdit={() => setViewing(plan)}
            isDeletePending={false}
          />
        ))}
      </div>
      {viewing ? <DailyPlanViewer plan={viewing} onClose={() => setViewing(null)} /> : null}
    </>
  );
}
