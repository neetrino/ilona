'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Group } from '../../types';
import { getGroupWeeklySlots } from '../../group-schedule-utils';
import { getGroupOccupancyMeta } from '../../occupancy';
import { getGroupTeachersForDisplay } from '../../lib/group-teachers-display';
import { formatScheduleSummary } from '../group-card/group-card.util';
import { formatLocaleDate } from '@/shared/lib/utils';

interface GroupDetailGeneralTabProps {
  group: Group;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-[rgba(14,14,16,0.06)] py-3 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4 sm:items-start">
      <dt className="text-sm font-medium text-[#8b8b90]">{label}</dt>
      <dd className="text-sm font-medium text-[#0e0e10]">{value}</dd>
    </div>
  );
}

export function GroupDetailGeneralTab({ group }: GroupDetailGeneralTabProps) {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const teachers = getGroupTeachersForDisplay(group);
  const scheduleSlots = formatScheduleSummary(getGroupWeeklySlots(group.schedule));
  const studentCount = group._count?.students ?? group.students?.length ?? 0;
  const occupancy = getGroupOccupancyMeta(studentCount);
  const occupancyLabel =
    occupancy.status === 'full'
      ? t('occupancyFull')
      : occupancy.status === 'filling'
        ? t('occupancyFilling')
        : t('occupancyRed');

  const teacherNames =
    teachers.length > 0
      ? teachers
          .map((teacher) => `${teacher.user.firstName} ${teacher.user.lastName}`.trim())
          .join(', ')
      : tCommon('notAssigned');

  return (
    <div className="rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white p-5 sm:p-6">
      <dl>
        <InfoRow label={tCommon('center')} value={group.center?.name || '—'} />
        <InfoRow label={t('level')} value={group.level?.trim() || '—'} />
        <InfoRow label={t('teacher')} value={teacherNames} />
        <InfoRow
          label={t('studentsCount')}
          value={`${studentCount}${group.maxStudents ? ` / ${group.maxStudents}` : ''}`}
        />
        <InfoRow label={t('detailOccupancy')} value={occupancyLabel} />
        <InfoRow
          label={tCommon('status')}
          value={group.isActive ? t('detailStatusActive') : t('detailStatusInactive')}
        />
        <InfoRow
          label={t('schedule')}
          value={scheduleSlots?.join(' · ') || t('detailNoSchedule')}
        />
        <InfoRow
          label={t('detailDescription')}
          value={group.description?.trim() || t('noDescription')}
        />
        <InfoRow
          label={tCommon('created')}
          value={formatLocaleDate(new Date(group.createdAt), locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        />
        <InfoRow
          label={tCommon('updated')}
          value={formatLocaleDate(new Date(group.updatedAt), locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        />
      </dl>
    </div>
  );
}
