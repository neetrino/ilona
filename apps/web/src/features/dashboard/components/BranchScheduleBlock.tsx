'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useGroups } from '@/features/groups/hooks/useGroups';
import type { Group, GroupScheduleEntry } from '@/features/groups/types';

interface TodayEntry {
  group: Group;
  entry: GroupScheduleEntry;
}

function collectToday(groups: Group[]): TodayEntry[] {
  const todayJsDay = new Date().getDay();
  const list: TodayEntry[] = [];
  for (const group of groups) {
    if (!group.isActive) continue;
    for (const entry of group.schedule ?? []) {
      if (entry.dayOfWeek === todayJsDay) list.push({ group, entry });
    }
  }
  return list.sort((a, b) => a.entry.startTime.localeCompare(b.entry.startTime));
}

export function BranchScheduleBlock({ centerId }: { centerId?: string }) {
  const t = useTranslations('dashboard');
  const { locale } = useParams<{ locale: string }>();
  const { data, isLoading } = useGroups({ centerId, take: 100 });
  const today = useMemo(() => collectToday(data?.items ?? []).slice(0, 8), [data?.items]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{t('branchSchedule')}</h2>
        <Link href={`/${locale}/admin/schedule`} className="text-sm text-blue-600 hover:underline">
          {t('viewSchedule')}
        </Link>
      </header>
      {isLoading ? (
        <p className="text-sm text-slate-400">{t('loading')}</p>
      ) : today.length === 0 ? (
        <p className="text-sm text-slate-500">{t('noLessonsToday')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {today.map(({ group, entry }) => {
            const teacherName = group.teacher
              ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}`
              : t('noTeacher');
            return (
              <li key={`${group.id}-${entry.startTime}`} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{group.name}</p>
                  <p className="text-xs text-slate-500">
                    {group.center.name} · {teacherName}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {entry.startTime} — {entry.endTime}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
