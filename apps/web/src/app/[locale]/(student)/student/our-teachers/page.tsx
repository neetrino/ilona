'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { TeacherDetailsModal, TeacherShowcaseCard, type Teacher } from '@/features/teachers';
import { Sparkles } from 'lucide-react';
import {
  StudentCountChip,
  StudentEmptyState,
  StudentErrorState,
  StudentLoadingState,
  StudentPageStack,
} from '@/features/student-ui';

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
      <StudentPageStack>
        <StudentCountChip>
          <Sparkles className="h-4 w-4 text-[#8b4a00]" aria-hidden="true" />
          {tTeachers('allTeachersCount', { count: teachers.length })}
        </StudentCountChip>

        {isLoading && <StudentLoadingState message={tCommon('loading')} />}

        {!isLoading && error && (
          <StudentErrorState title={tTeachers('failedToLoad')} message={tTeachers('failedToLoad')} />
        )}

        {!isLoading && !error && teachers.length === 0 && (
          <StudentEmptyState title={tCommon('noData')} message={tCommon('noData')} />
        )}

        {!isLoading && !error && teachers.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teachers.map((teacher) => (
              <TeacherShowcaseCard
                key={teacher.id}
                teacher={teacher}
                variant="student"
                onCardClick={() => setSelectedTeacherId(teacher.id)}
              />
            ))}
          </div>
        )}
      </StudentPageStack>
      <TeacherDetailsModal
        teacherId={selectedTeacherId}
        open={Boolean(selectedTeacherId)}
        onClose={() => setSelectedTeacherId(null)}
        showInternalStats={false}
        showInternalMeta={false}
      />
    </DashboardLayout>
  );
}
