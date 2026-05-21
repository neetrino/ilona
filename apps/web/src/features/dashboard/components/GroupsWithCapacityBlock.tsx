'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useGroups } from '@/features/groups/hooks/useGroups';
import type { Group } from '@/features/groups/types';
import { GroupIconDisplay } from '@/features/groups';
import { PortalDashboardSection } from '@/features/student-ui';

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
    <PortalDashboardSection
      title={t('groupsWithCapacity')}
      viewAllHref={`/${locale}/admin/groups`}
      viewAllLabel={t('viewAll')}
    >
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('noCapacity')}</p>
      ) : (
        <ul className="divide-y divide-[rgba(14,14,16,0.07)]">
          {rows.map(({ group, occupied, free }) => (
            <li key={group.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <GroupIconDisplay iconKey={group.iconKey} size={18} className="shrink-0 text-[#8b8b90]" />
                  <p className="truncate text-sm font-medium text-[#1010a3]">{group.name}</p>
                </div>
                <p className="text-xs text-[#8b8b90]">
                  {group.center.name}
                  {group.level ? ` · ${group.level}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#0d6b42]">
                  {t('freeSeats', { count: free })}
                </p>
                <p className="text-xs text-[#8b8b90]">
                  {occupied}/{group.maxStudents}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PortalDashboardSection>
  );
}
