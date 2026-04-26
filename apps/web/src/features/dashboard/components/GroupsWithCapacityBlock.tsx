'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useGroups } from '@/features/groups/hooks/useGroups';
import type { Group } from '@/features/groups/types';
import { GroupIconDisplay } from '@/features/groups';

interface CapacityRow {
  group: Group;
  occupied: number;
  free: number;
}

function toRows(groups: Group[]): CapacityRow[] {
  return groups
    .filter((g) => g.isActive !== false)
    .map((group) => {
      const occupied = group._count?.students ?? 0;
      const free = Math.max(0, group.maxStudents - occupied);
      return { group, occupied, free };
    })
    .filter((row) => row.free > 0)
    .sort((a, b) => b.free - a.free)
    .slice(0, 6);
}

export function GroupsWithCapacityBlock({ centerId }: { centerId?: string }) {
  const t = useTranslations('dashboard');
  const { locale } = useParams<{ locale: string }>();
  const { data, isLoading } = useGroups({ centerId, take: 100 });
  const rows = useMemo(() => toRows(data?.items ?? []), [data?.items]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{t('groupsWithCapacity')}</h2>
        <Link href={`/${locale}/admin/groups`} className="text-sm text-blue-600 hover:underline">
          {t('viewAll')}
        </Link>
      </header>
      {isLoading ? (
        <p className="text-sm text-slate-400">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">{t('noCapacity')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map(({ group, occupied, free }) => (
            <li key={group.id} className="flex items-center justify-between py-2">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <GroupIconDisplay iconKey={group.iconKey} size={18} className="shrink-0 text-slate-600" />
                  <p className="truncate text-sm font-medium text-slate-800">{group.name}</p>
                </div>
                <p className="text-xs text-slate-500">
                  {group.center.name}
                  {group.level ? ` · ${group.level}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-600">
                  {t('freeSeats', { count: free })}
                </p>
                <p className="text-xs text-slate-500">
                  {occupied}/{group.maxStudents}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
