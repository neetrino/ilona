'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { useTranslations as useTranslationsType } from 'next-intl';
import { TeacherCard } from './TeacherCard';
import type { Teacher } from '@/features/teachers';
import { AdminPaginationControls } from '@/shared/components/ui';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { cn } from '@/shared/lib/utils';
import { scrollListStartSoon } from '@/shared/lib/scroll-element-to-list-start';

interface AllTeachersBoardGridProps {
  teachers: Teacher[];
  isLoading: boolean;
  searchQuery: string;
  onEdit: (teacher: Teacher) => void;
  onCardClick?: (teacher: Teacher) => void;
  t: ReturnType<typeof useTranslationsType<'teachers'>>;
}

const MOBILE_TEACHERS_PAGE_SIZE = 5;
const IPAD_TEACHERS_PAGE_SIZE = 10;

export function AllTeachersBoardGrid({
  teachers,
  isLoading,
  searchQuery,
  onEdit,
  onCardClick,
  t,
}: AllTeachersBoardGridProps) {
  const tc = useTranslations('common');
  const [mobileTeachersPage, setMobileTeachersPage] = useState(0);
  const isIPad = useIsIPad();
  const mobileTeachersStartRef = useRef<HTMLDivElement | null>(null);
  const teachersPageSize = isIPad ? IPAD_TEACHERS_PAGE_SIZE : MOBILE_TEACHERS_PAGE_SIZE;
  const totalMobileTeachersPages = Math.max(
    1,
    Math.ceil(teachers.length / teachersPageSize),
  );
  const safeMobileTeachersPage = Math.min(
    Math.max(0, mobileTeachersPage),
    totalMobileTeachersPages - 1,
  );
  const paginatedTeachers = useMemo(
    () =>
      teachers.slice(
        safeMobileTeachersPage * teachersPageSize,
        safeMobileTeachersPage * teachersPageSize + teachersPageSize,
      ),
    [safeMobileTeachersPage, teachers, teachersPageSize],
  );

  useEffect(() => {
    setMobileTeachersPage(0);
  }, [searchQuery, teachers.length]);

  useEffect(() => {
    setMobileTeachersPage(0);
  }, [isIPad]);

  const goToMobileTeachersPage = (nextPage: number) => {
    setMobileTeachersPage(nextPage);
    scrollListStartSoon(mobileTeachersStartRef.current);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#8b8b90]">{t('loadingTeacherInfo')}</div>
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#8b8b90]">
          {searchQuery.trim() ? t('noTeachersMatch') : t('noTeachersFound')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div ref={mobileTeachersStartRef} className="sm:hidden" />
      <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-3 sm:hidden">
        {paginatedTeachers.map((teacher) => (
          <TeacherCard
            key={teacher.id}
            teacher={teacher}
            onEdit={() => onEdit(teacher)}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      <div
        className={cn(
          'hidden w-full min-w-0 grid-cols-1 items-stretch gap-4 sm:grid sm:grid-cols-2',
          isIPad ? 'lg:grid-cols-2 xl:grid-cols-2' : 'lg:grid-cols-4 xl:grid-cols-4',
        )}
      >
        {(isIPad ? paginatedTeachers : teachers).map((teacher) => (
          <TeacherCard
            key={teacher.id}
            teacher={teacher}
            onEdit={() => onEdit(teacher)}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      {teachers.length > teachersPageSize && (
        <div className="flex items-center justify-center sm:hidden">
          <AdminPaginationControls
            page={safeMobileTeachersPage}
            totalPages={totalMobileTeachersPages}
            onPageChange={goToMobileTeachersPage}
            previousLabel={tc('previousCardsPage')}
            nextLabel={tc('nextCardsPage')}
          />
        </div>
      )}
    </div>
  );
}
