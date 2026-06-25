'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { TeacherDetailsModal, TeacherShowcaseCard, type Teacher } from '@/features/teachers';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { cn } from '@/shared/lib/utils';
import { Sparkles } from 'lucide-react';
import {
  StudentCountChip,
  StudentEmptyState,
  StudentErrorState,
  StudentLoadingState,
  StudentPageStack,
} from '@/features/student-ui';

const PAGE_SIZE = 100;
const MOBILE_TEACHERS_PAGE_SIZE = 5;

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
  const [mobilePage, setMobilePage] = useState(0);
  const mobileTeachersStartRef = useRef<HTMLDivElement | null>(null);
  const isIPad = useIsIPad();

  const { data: teachers = [], isLoading, error } = useQuery({
    queryKey: ['student', 'our-teachers', 'all'],
    queryFn: fetchAllTeachers,
  });

  const totalMobilePages = Math.max(1, Math.ceil(teachers.length / MOBILE_TEACHERS_PAGE_SIZE));
  const safeMobilePage = Math.min(Math.max(0, mobilePage), totalMobilePages - 1);

  const mobileTeachers = useMemo(
    () =>
      teachers.slice(
        safeMobilePage * MOBILE_TEACHERS_PAGE_SIZE,
        safeMobilePage * MOBILE_TEACHERS_PAGE_SIZE + MOBILE_TEACHERS_PAGE_SIZE,
      ),
    [teachers, safeMobilePage],
  );

  useEffect(() => {
    setMobilePage(0);
  }, [teachers.length]);

  const goToMobilePage = (nextPage: number) => {
    setMobilePage(nextPage);
    requestAnimationFrame(() => {
      mobileTeachersStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const renderTeacherCard = (teacher: Teacher) => (
    <TeacherShowcaseCard
      key={teacher.id}
      teacher={teacher}
      variant="student"
      onCardClick={() => setSelectedTeacherId(teacher.id)}
    />
  );

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
          <div className="space-y-4">
            <div ref={mobileTeachersStartRef} className="sm:hidden" />
            <div className="grid grid-cols-1 gap-5 sm:hidden">
              {mobileTeachers.map(renderTeacherCard)}
            </div>
            {teachers.length > MOBILE_TEACHERS_PAGE_SIZE && (
              <div className="flex items-center justify-between text-sm text-[#8b8b90] sm:hidden">
                <span>
                  {safeMobilePage * MOBILE_TEACHERS_PAGE_SIZE + 1}-
                  {Math.min((safeMobilePage + 1) * MOBILE_TEACHERS_PAGE_SIZE, teachers.length)} /{' '}
                  {teachers.length}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                      safeMobilePage === 0
                        ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                        : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]',
                    )}
                    disabled={safeMobilePage === 0}
                    onClick={() => goToMobilePage(Math.max(0, safeMobilePage - 1))}
                    aria-label={tCommon('back')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
                    {safeMobilePage + 1}
                  </span>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                      safeMobilePage >= totalMobilePages - 1
                        ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                        : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]',
                    )}
                    disabled={safeMobilePage >= totalMobilePages - 1}
                    onClick={() => goToMobilePage(Math.min(totalMobilePages - 1, safeMobilePage + 1))}
                    aria-label={tCommon('next')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <div
              className={cn(
                'hidden w-full min-w-0 grid-cols-1 gap-5 sm:grid sm:grid-cols-2',
                isIPad ? 'lg:grid-cols-2 xl:grid-cols-2' : 'lg:grid-cols-3 xl:grid-cols-4',
              )}
            >
              {teachers.map(renderTeacherCard)}
            </div>
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
