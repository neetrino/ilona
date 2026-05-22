'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useGroups } from '@/features/groups/hooks/useGroups';
import type { Group } from '@/features/groups/types';
import { GroupIconDisplay } from '@/features/groups';
import { PublicAssetImage } from '@/shared/components/ui';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';

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
  const { user } = useAuthStore();
  const basePath = getAdminPortalBasePath(user?.role);
  const { data, isLoading } = useGroups({ centerId, take: 100 });
  const rows = useMemo(() => toRows(data?.items ?? []), [data?.items]);

  return (
    <section className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-[#f6f7ff] p-5 shadow-[0_10px_30px_-24px_rgba(16,16,163,0.45)] sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
        <h2 className="text-[clamp(0.875rem,1.25vw,1rem)] font-semibold tracking-tight text-[#1010a3]">
          {t('groupsWithCapacity')}
        </h2>
        <Link
          href={`/${locale}${basePath}/groups`}
          className="inline-flex h-9 items-center rounded-full border border-[#1010a3]/20 bg-white px-4 text-sm font-medium text-[#1010a3] transition-colors hover:bg-[#ececff]"
        >
          {t('viewAll')}
        </Link>
      </header>
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('noCapacity')}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ group, occupied, free }) => (
            <li
              key={group.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-4 shadow-[0_14px_30px_-28px_rgba(16,16,163,0.9)] transition-shadow hover:shadow-[0_22px_40px_-32px_rgba(16,16,163,0.9)]"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-[2.25rem] w-[2.25rem] shrink-0 items-center justify-center rounded-[0.875rem] bg-[#dffc76]">
                  <PublicAssetImage
                    src={STUDENT_DASHBOARD_ASSETS.iconAttendance}
                    alt=""
                    width={18}
                    height={18}
                    className="h-[1.125rem] w-[1.125rem] object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <GroupIconDisplay iconKey={group.iconKey} size={18} className="shrink-0 text-[#8b8b90]" />
                    <p className="truncate text-sm font-semibold text-[#1010a3]">{group.name}</p>
                  </div>
                  <p className="text-xs text-[#8b8b90]">
                    {group.center.name}
                    {group.level ? ` · ${group.level}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold tracking-[-0.01em] text-[#0a7a3e]">
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
    </section>
  );
}
