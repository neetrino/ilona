'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { TeacherDetailsModal, type Teacher } from '@/features/teachers';
import { Avatar } from '@/shared/components/ui';
import { formatExperienceLabel, getExperienceYearsFromHireDate } from '@/features/teachers/utils/experience';
import { Award, Sparkles } from 'lucide-react';

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

function TeacherCard({
  teacher,
  onOpenDetails,
}: {
  teacher: Teacher;
  onOpenDetails: (teacherId: string) => void;
}) {
  const fullName = getTeacherName(teacher);
  const experienceLabel = formatExperienceLabel(getExperienceYearsFromHireDate(teacher.hireDate));

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
      className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="relative mb-4 flex w-full justify-center">
        <Avatar
          src={teacher.user.avatarUrl}
          name={fullName}
          size="xl"
          className="z-10 h-72 w-full rounded-2xl border border-slate-100 bg-slate-50 object-contain ring-2 ring-white shadow-md transition-transform duration-300 group-hover:scale-[1.01] md:h-80"
        />
      </div>

      <div className="min-w-0 text-center">
        <h3 className="truncate text-xl font-semibold text-slate-900">{fullName}</h3>
        <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 sm:text-sm">
          <Award className="h-3.5 w-3.5 shrink-0 text-slate-500 sm:h-4 sm:w-4" aria-hidden="true" />
          <span className="truncate">{experienceLabel}</span>
        </p>
      </div>
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
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
          <Sparkles className="h-4 w-4 text-amber-600" aria-hidden="true" />
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
