'use client';

import { useTranslations } from 'next-intl';
import { Phone } from 'lucide-react';
import { Avatar } from '@/shared/components/ui';
import { formatPhoneForDisplay } from '@/shared/lib/utils';
import { ScheduleGrid } from '@/features/schedule/ScheduleGrid';
import type { CenterDetails } from '../../types';
import {
  mapCenterGroupToScheduleGroup,
  normalizeSchedule,
  teacherName,
  userName,
} from './center-details-modal.util';
import type { CenterDetailsTabId } from './center-details-modal.types';

function CenterDetailsEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function TeachersTab({ data }: { data: CenterDetails }) {
  const t = useTranslations('centers');
  if (data.teachers.length === 0) {
    return <CenterDetailsEmptyState message={t('noTeachersInBranch')} />;
  }
  return (
    <ul className="space-y-2.5 px-0">
      {data.teachers.map((teacher) => (
        <li
          key={teacher.id}
          className="flex w-full items-center justify-between gap-3 rounded-[15px] border border-[#e2e5ea] bg-white p-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 sm:animate-none sm:rounded-lg sm:border-slate-200 sm:p-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={teacher.user?.avatarUrl ?? undefined} name={teacherName(teacher)} size="md" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-tight text-slate-900 sm:text-sm sm:font-medium">{teacherName(teacher)}</p>
              {teacher.user?.email && (
                <p className="truncate text-xs text-slate-500 sm:text-xs">
                  {teacher.user.email}
                </p>
              )}
            </div>
          </div>
          <span className="inline-flex min-h-7 items-center justify-center self-center whitespace-nowrap rounded-full bg-[#eef0f4] px-2.5 py-0.5 text-center text-xs font-semibold leading-none text-slate-700">
            {t('teacherGroupCount', { count: teacher._count?.groups ?? 0 })}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StudentsTab({ data }: { data: CenterDetails }) {
  const t = useTranslations('centers');
  if (data.students.length === 0) {
    return <CenterDetailsEmptyState message={t('noStudentsInBranch')} />;
  }
  return (
    <ul className="space-y-3 px-0">
      {data.students.map((s) => (
        <li
          key={s.id}
          className="flex w-full items-center justify-between gap-3 rounded-[15px] border border-[#e2e5ea] bg-white p-3.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 sm:animate-none sm:rounded-lg sm:border-slate-200 sm:p-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={s.user?.avatarUrl ?? undefined} name={userName(s.user)} size="md" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold leading-tight text-slate-900 sm:text-sm sm:font-medium">{userName(s.user)}</p>
              {s.user?.phone && (
                <p className="flex items-center gap-1.5 truncate text-sm text-slate-500 sm:text-xs">
                  <Phone className="size-4 sm:size-3" /> {formatPhoneForDisplay(s.user.phone)}
                </p>
              )}
            </div>
          </div>
          <span className="truncate rounded-full bg-[#eef0f4] px-3 py-1 text-sm font-semibold text-slate-700">
            {s.groupName}
          </span>
        </li>
      ))}
    </ul>
  );
}

function GroupsTab({ data }: { data: CenterDetails }) {
  const t = useTranslations('centers');
  if (data.groups.length === 0) {
    return <CenterDetailsEmptyState message={t('noGroupsInBranchDetail')} />;
  }
  return (
    <ul className="space-y-2">
      {data.groups.map((g) => (
        <li
          key={g.id}
          className="rounded-lg border border-slate-200 bg-white p-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 sm:animate-none"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{g.name}</p>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                {t('studentsCountBadge', { count: g._count?.students ?? g.students.length })}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                {t('lessonsCountBadge', { count: g._count?.lessons ?? 0 })}
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {t('teacher1Label')}{' '}
            <span className="text-slate-700">{teacherName(g.teacher)}</span>
            {g.secondTeacher && (
              <>
                {' '}
                · {t('teacher2Label')}{' '}
                <span className="text-slate-700">{teacherName(g.secondTeacher)}</span>
              </>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ScheduleTab({ data }: { data: CenterDetails }) {
  const t = useTranslations('centers');
  const scheduleGroups = data.groups
    .filter((g) => normalizeSchedule(g.schedule).length > 0)
    .map((group) => mapCenterGroupToScheduleGroup(data, group));

  if (scheduleGroups.length === 0) {
    return <CenterDetailsEmptyState message={t('noSchedulesConfigured')} />;
  }

  return <ScheduleGrid groups={scheduleGroups} fitToContainer />;
}

function InfoTab({ data }: { data: CenterDetails }) {
  const t = useTranslations('centers');
  const tCommon = useTranslations('common');
  const c = data.center;
  const rows: Array<{ label: string; value: string | null }> = [
    { label: tCommon('name'), value: c.name },
    { label: t('form.address'), value: c.address },
    { label: t('form.phone'), value: formatPhoneForDisplay(c.phone) },
    { label: tCommon('email'), value: c.email },
    { label: tCommon('status'), value: c.isActive ? t('activeStatus') : t('inactiveStatus') },
    { label: t('form.description'), value: c.description },
  ];
  return (
    <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white animate-in fade-in-0 slide-in-from-bottom-2 duration-500 sm:animate-none">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
          <dt className="font-medium text-slate-500">{r.label}</dt>
          <dd className="col-span-2 text-slate-900">{r.value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

type CenterDetailsModalTabContentProps = {
  data: CenterDetails;
  activeTab: CenterDetailsTabId;
};

export function CenterDetailsModalTabContent({ data, activeTab }: CenterDetailsModalTabContentProps) {
  if (activeTab === 'teachers') return <TeachersTab data={data} />;
  if (activeTab === 'students') return <StudentsTab data={data} />;
  if (activeTab === 'groups') return <GroupsTab data={data} />;
  if (activeTab === 'schedule') return <ScheduleTab data={data} />;
  return <InfoTab data={data} />;
}
