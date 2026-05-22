'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useGroups } from '@/features/groups/hooks/useGroups';
import type { Group, GroupScheduleEntry } from '@/features/groups/types';
import { GroupIconDisplay } from '@/features/groups';
import { getGroupWeeklySlots } from '@/features/groups/group-schedule-utils';
import { PublicAssetImage } from '@/shared/components/ui';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';

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
    <section className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-[#f6f7ff] p-5 shadow-[0_10px_30px_-24px_rgba(16,16,163,0.45)] sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
        <h2 className="text-[clamp(0.875rem,1.25vw,1rem)] font-semibold tracking-tight text-[#1010a3]">
          {t('branchSchedule')}
        </h2>
        <Link
          href={`/${locale}/admin/schedule`}
          className="inline-flex h-9 items-center rounded-full border border-[#1010a3]/20 bg-white px-4 text-sm font-medium text-[#1010a3] transition-colors hover:bg-[#ececff]"
        >
          {t('viewSchedule')}
        </Link>
      </header>
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : today.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('noLessonsToday')}</p>
      ) : (
        <ul className="space-y-3">
          {today.map(({ group, entry }) => {
            const teacherName = group.teacher
              ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}`
              : t('noTeacher');
            return (
              <li
                key={`${group.id}-${entry.startTime}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-4 shadow-[0_14px_30px_-28px_rgba(16,16,163,0.9)] transition-shadow hover:shadow-[0_22px_40px_-32px_rgba(16,16,163,0.9)]"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-[2.25rem] w-[2.25rem] shrink-0 items-center justify-center rounded-[0.875rem] bg-[#ddecff]">
                    <PublicAssetImage
                      src={STUDENT_DASHBOARD_ASSETS.calendarIcon}
                      alt=""
                      width={18}
                      height={18}
                      className="h-[1.125rem] w-[1.125rem] object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <GroupIconDisplay
                        iconKey={group.iconKey}
                        size={18}
                        className="shrink-0 text-[#8b8b90]"
                      />
                      <p className="truncate text-sm font-semibold text-[#1010a3]">{group.name}</p>
                    </div>
                    <p className="text-xs text-[#8b8b90]">
                      {group.center.name} · {teacherName}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#3b3b40]">
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
