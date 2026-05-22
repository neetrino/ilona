'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useGroups } from '@/features/groups/hooks/useGroups';
import type { Group, GroupScheduleEntry } from '@/features/groups/types';
import { GroupIconDisplay } from '@/features/groups';
import { getGroupWeeklySlots } from '@/features/groups/group-schedule-utils';
import { PortalDashboardSection } from '@/features/student-ui';

interface TodayEntry {
  group: Group;
  entry: GroupScheduleEntry;
}

function collectToday(groups: Group[]): TodayEntry[] {
  const todayJsDay = new Date().getDay();
  const list: TodayEntry[] = [];
  for (const group of groups) {
    if (!group.isActive) continue;
    for (const entry of getGroupWeeklySlots(group.schedule)) {
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
    <PortalDashboardSection
      title={t('branchSchedule')}
      viewAllHref={`/${locale}/admin/schedule`}
      viewAllLabel={t('viewSchedule')}
    >
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : today.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('noLessonsToday')}</p>
      ) : (
        <ul className="divide-y divide-[rgba(14,14,16,0.07)]">
          {today.map(({ group, entry }) => {
            const teacherName = group.teacher
              ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}`
              : t('noTeacher');
            return (
              <li
                key={`${group.id}-${entry.startTime}`}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <GroupIconDisplay iconKey={group.iconKey} size={18} className="shrink-0 text-[#8b8b90]" />
                    <p className="truncate text-sm font-medium text-[#1010a3]">{group.name}</p>
                  </div>
                  <p className="text-xs text-[#8b8b90]">
                    {group.center.name} · {teacherName}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[#3b3b40]">
                  {entry.startTime} — {entry.endTime}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </PortalDashboardSection>
  );
}
