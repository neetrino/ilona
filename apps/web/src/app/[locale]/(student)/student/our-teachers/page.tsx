'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AdminPaginationControls } from '@/shared/components/ui';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { TeacherDetailsModal, TeacherShowcaseCard, type Teacher } from '@/features/teachers';
import { useMyTeachers } from '@/features/students/hooks/useStudents';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { cn } from '@/shared/lib/utils';
import { scrollListStartSoon } from '@/shared/lib/scroll-element-to-list-start';
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
const DESKTOP_TEACHERS_PAGE_SIZE = 8;

function prioritizeAssignedTeachers(
  teachers: Teacher[],
  assignedTeacherIds: string[],
): Teacher[] {
  if (assignedTeacherIds.length === 0) {
    return teachers;
  }

  const byId = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const assigned: Teacher[] = [];
  const assignedIdSet = new Set<string>();

  for (const id of assignedTeacherIds) {
    const teacher = byId.get(id);
    if (teacher && !assignedIdSet.has(id)) {
      assigned.push(teacher);
      assignedIdSet.add(id);
    }
  }

  const rest = teachers.filter((teacher) => !assignedIdSet.has(teacher.id));
  return [...assigned, ...rest];
}

type TeachersPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  backLabel: string;
  nextLabel: string;
  className?: string;
};

function TeachersPagination({
  page,
  totalPages,
  onPageChange,
  backLabel,
  nextLabel,
  className,
}: TeachersPaginationProps) {
  return (
    <div className={cn('flex items-center justify-center lg:justify-start', className)}>
      <AdminPaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        previousLabel={backLabel}
        nextLabel={nextLabel}
      />
    </div>
  );
}

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
  const [desktopPage, setDesktopPage] = useState(0);
  const mobileTeachersStartRef = useRef<HTMLDivElement | null>(null);
  const desktopTeachersStartRef = useRef<HTMLDivElement | null>(null);
  const isIPad = useIsIPad();

  const {
    data: allTeachers = [],
    isLoading: isLoadingAll,
    error,
  } = useQuery({
    queryKey: ['student', 'our-teachers', 'all'],
    queryFn: fetchAllTeachers,
  });
  const { data: myTeachers = [], isLoading: isLoadingMine } = useMyTeachers();

  const assignedTeacherIds = useMemo(
    () => new Set(myTeachers.map((teacher) => teacher.id)),
    [myTeachers],
  );

  const teachers = useMemo(() => {
    return prioritizeAssignedTeachers(allTeachers, Array.from(assignedTeacherIds));
  }, [allTeachers, assignedTeacherIds]);

  const isLoading = isLoadingAll || isLoadingMine;

  const totalMobilePages = Math.max(1, Math.ceil(teachers.length / MOBILE_TEACHERS_PAGE_SIZE));
  const safeMobilePage = Math.min(Math.max(0, mobilePage), totalMobilePages - 1);
  const totalDesktopPages = Math.max(1, Math.ceil(teachers.length / DESKTOP_TEACHERS_PAGE_SIZE));
  const safeDesktopPage = Math.min(Math.max(0, desktopPage), totalDesktopPages - 1);

  const mobileTeachers = useMemo(
    () =>
      teachers.slice(
        safeMobilePage * MOBILE_TEACHERS_PAGE_SIZE,
        safeMobilePage * MOBILE_TEACHERS_PAGE_SIZE + MOBILE_TEACHERS_PAGE_SIZE,
      ),
    [teachers, safeMobilePage],
  );

  const desktopTeachers = useMemo(
    () =>
      teachers.slice(
        safeDesktopPage * DESKTOP_TEACHERS_PAGE_SIZE,
        safeDesktopPage * DESKTOP_TEACHERS_PAGE_SIZE + DESKTOP_TEACHERS_PAGE_SIZE,
      ),
    [teachers, safeDesktopPage],
  );

  useEffect(() => {
    setMobilePage(0);
    setDesktopPage(0);
  }, [teachers.length]);

  const scrollToTeachersStart = (ref: React.RefObject<HTMLDivElement | null>) => {
    scrollListStartSoon(ref.current);
  };

  const goToMobilePage = (nextPage: number) => {
    setMobilePage(nextPage);
    scrollToTeachersStart(mobileTeachersStartRef);
  };

  const goToDesktopPage = (nextPage: number) => {
    setDesktopPage(nextPage);
    scrollToTeachersStart(desktopTeachersStartRef);
  };

  const renderTeacherCard = (teacher: Teacher) => (
    <TeacherShowcaseCard
      key={teacher.id}
      teacher={teacher}
      variant="student"
      onCardClick={() => setSelectedTeacherId(teacher.id)}
      myTeacherLabel={
        assignedTeacherIds.has(teacher.id) ? tTeachers('myTeacherBadge') : undefined
      }
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
              <TeachersPagination
                className="sm:hidden"
                page={safeMobilePage}
                totalPages={totalMobilePages}
                onPageChange={goToMobilePage}
                backLabel={tCommon('back')}
                nextLabel={tCommon('next')}
              />
            )}
            <div ref={desktopTeachersStartRef} className="hidden sm:block" />
            <div
              className={cn(
                'hidden w-full min-w-0 grid-cols-1 gap-5 sm:grid sm:grid-cols-2',
                isIPad ? 'lg:grid-cols-2 xl:grid-cols-2' : 'lg:grid-cols-3 xl:grid-cols-4',
              )}
            >
              {desktopTeachers.map(renderTeacherCard)}
            </div>
            {teachers.length > DESKTOP_TEACHERS_PAGE_SIZE && (
              <TeachersPagination
                className="hidden sm:flex"
                page={safeDesktopPage}
                totalPages={totalDesktopPages}
                onPageChange={goToDesktopPage}
                backLabel={tCommon('back')}
                nextLabel={tCommon('next')}
              />
            )}
          </div>
        )}
      </StudentPageStack>
      <TeacherDetailsModal
        teacherId={selectedTeacherId}
        open={Boolean(selectedTeacherId)}
        onClose={() => setSelectedTeacherId(null)}
        showInternalStats={false}
        showInternalMeta={false}
        scrollClassName="pt-3 min-[1367px]:pt-5"
      />
    </DashboardLayout>
  );
}
