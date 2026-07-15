'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, formatDisplayName, PublicAssetImage } from '@/shared/components/ui';
import { useMyProfile, useMyTeachers } from '@/features/students';
import type { AssignedTeacher } from '@/features/students/api/students.api';
import { STUDENT_DASHBOARD_ASSETS } from './assets';

function TeachersCardBody({
  teachers,
  emptyLabel,
}: {
  teachers: AssignedTeacher[];
  emptyLabel: string;
}) {
  if (teachers.length === 0) {
    return <p className="mt-4 text-sm text-[#8b8b90]">{emptyLabel}</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {teachers.map((teacher) => {
        const name =
          teacher.name ||
          formatDisplayName(teacher.firstName, teacher.lastName);

        return (
          <li key={teacher.id} className="flex min-w-0 items-center gap-3">
            <Avatar src={teacher.avatarUrl} name={name} size="sm" className="shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1010a3]">{name}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function GroupsCardBody({
  groupName,
  level,
  centerName,
  emptyLabel,
  levelLabel,
}: {
  groupName?: string | null;
  level?: string | null;
  centerName?: string | null;
  emptyLabel: string;
  levelLabel: string;
}) {
  if (!groupName) {
    return <p className="mt-4 text-sm text-[#8b8b90]">{emptyLabel}</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="truncate text-[1.375rem] font-bold leading-tight tracking-tight text-[#1010a3]">
        {groupName}
      </p>
      {level ? (
        <p className="text-sm text-[#3b3b40]">
          {levelLabel}: <span className="font-medium text-[#1010a3]">{level}</span>
        </p>
      ) : null}
      {centerName ? <p className="truncate text-xs text-[#8b8b90]">{centerName}</p> : null}
    </div>
  );
}

export function StudentDashboardMyPeopleCards() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { data: teachers = [], isLoading: isLoadingTeachers } = useMyTeachers();
  const { data: profile, isLoading: isLoadingProfile } = useMyProfile();
  const isLoading = isLoadingTeachers || isLoadingProfile;
  const group = profile?.group;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-[11rem] animate-pulse rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
      <Link
        href={`/${locale}/student/our-teachers`}
        className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-5 transition-shadow hover:shadow-md sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs tracking-wide text-[#8b8b90]">{t('myTeachers')}</p>
            <p className="mt-1 text-xs text-[#3b3b40]">
              {t('myTeachersCaption', { count: teachers.length })}
            </p>
          </div>
          <div className="flex h-[2.625rem] w-[2.625rem] shrink-0 items-center justify-center rounded-[0.875rem] bg-[#e8e8fc]">
            <PublicAssetImage
              src={STUDENT_DASHBOARD_ASSETS.iconAttendance}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </div>
        </div>
        <TeachersCardBody teachers={teachers} emptyLabel={t('noTeacher')} />
      </Link>

      <article className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs tracking-wide text-[#8b8b90]">{t('myGroups')}</p>
            <p className="mt-1 text-xs text-[#3b3b40]">
              {group ? t('myGroupsCaption') : t('noGroup')}
            </p>
          </div>
          <div className="flex h-[2.625rem] w-[2.625rem] shrink-0 items-center justify-center rounded-[0.875rem] bg-[#ddecff]">
            <PublicAssetImage
              src={STUDENT_DASHBOARD_ASSETS.iconBook}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </div>
        </div>
        <GroupsCardBody
          groupName={group?.name}
          level={group?.level}
          centerName={group?.center?.name}
          emptyLabel={t('noGroup')}
          levelLabel={t('level')}
        />
      </article>
    </div>
  );
}
