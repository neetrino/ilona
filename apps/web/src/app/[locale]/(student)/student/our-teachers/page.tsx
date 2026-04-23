'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { TeacherDetailsModal, type Teacher } from '@/features/teachers';
import { Avatar } from '@/shared/components/ui';

const PAGE_SIZE = 100;

async function fetchAllTeachers(): Promise<Teacher[]> {
  const firstPage = await fetchTeachers({ skip: 0, take: PAGE_SIZE });
  const total = firstPage.total ?? firstPage.items.length;

  if (total <= PAGE_SIZE) {
    return firstPage.items;
  }

  const requests: Array<ReturnType<typeof fetchTeachers>> = [];
  for (let skip = PAGE_SIZE; skip < total; skip += PAGE_SIZE) {
    requests.push(fetchTeachers({ skip, take: PAGE_SIZE }));
  }

  const restPages = await Promise.all(requests);
  const allItems = [firstPage, ...restPages].flatMap((page) => page.items);
  return allItems;
}

function getTeacherName(teacher: Teacher): string {
  return `${teacher.user.firstName} ${teacher.user.lastName}`.trim();
}

function getTeacherCenter(teacher: Teacher): string | null {
  const directCenter = teacher.centers?.[0]?.name;
  if (directCenter) return directCenter;

  const linkedCenter = teacher.centerLinks?.[0]?.center.name;
  if (linkedCenter) return linkedCenter;

  const groupCenter = teacher.groups?.find((group) => group.center)?.center?.name;
  return groupCenter ?? null;
}

function TeacherCard({
  teacher,
  onOpenDetails,
}: {
  teacher: Teacher;
  onOpenDetails: (teacherId: string) => void;
}) {
  const t = useTranslations('teachers');
  const fullName = getTeacherName(teacher);
  const center = getTeacherCenter(teacher);
  const bio = teacher.bio?.trim() || teacher.specialization?.trim() || t('noBio');

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(teacher.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails(teacher.id);
        }
      }}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <Avatar
          src={teacher.user.avatarUrl}
          name={fullName}
          size="lg"
          className="ring-2 ring-slate-100"
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900">{fullName}</h3>
          <p className="mt-1 text-sm text-slate-500">{center ?? t('noCenter')}</p>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-slate-600">{bio}</p>
    </article>
  );
}

export default function StudentOurTeachersPage() {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tTeachers = useTranslations('teachers');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const { data: teachers = [], isLoading, error } = useQuery({
    queryKey: ['student', 'our-teachers', 'all'],
    queryFn: fetchAllTeachers,
  });

  return (
    <DashboardLayout title={tNav('ourTeachers')} subtitle={tTeachers('studentSubtitle')}>
      <div className="space-y-5">
        <div className="text-sm text-slate-500">
          {tTeachers('allTeachersCount', { count: teachers.length })}
        </div>

        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            {tCommon('loading')}
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {tTeachers('failedToLoad')}
          </div>
        )}

        {!isLoading && !error && teachers.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            {tCommon('noData')}
          </div>
        )}

        {!isLoading && !error && teachers.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onOpenDetails={setSelectedTeacherId}
              />
            ))}
          </div>
        )}
      </div>
      <TeacherDetailsModal
        teacherId={selectedTeacherId}
        open={Boolean(selectedTeacherId)}
        onClose={() => setSelectedTeacherId(null)}
      />
    </DashboardLayout>
  );
}
