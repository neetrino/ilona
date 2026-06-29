'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { useTranslations as useTranslationsType } from 'next-intl';
import { TeacherCard } from './TeacherCard';
import type { Teacher } from '@/features/teachers';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { cn } from '@/shared/lib/utils';

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
    requestAnimationFrame(() => {
      mobileTeachersStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
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
        <div
          className={cn(
            'flex items-center text-sm text-[#8b8b90]',
            isIPad ? 'justify-start gap-4' : 'justify-between sm:hidden',
          )}
        >
          <span>
            {safeMobileTeachersPage * teachersPageSize + 1}-
            {Math.min((safeMobileTeachersPage + 1) * teachersPageSize, teachers.length)} / {teachers.length}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0',
                safeMobileTeachersPage === 0
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]',
              )}
              disabled={safeMobileTeachersPage === 0}
              onClick={() => goToMobileTeachersPage(Math.max(0, safeMobileTeachersPage - 1))}
              aria-label={tc('previousCardsPage')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
              {safeMobileTeachersPage + 1}
            </span>
            <button
              type="button"
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0',
                safeMobileTeachersPage >= totalMobileTeachersPages - 1
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]',
              )}
              disabled={safeMobileTeachersPage >= totalMobileTeachersPages - 1}
              onClick={() =>
                goToMobileTeachersPage(
                  Math.min(totalMobileTeachersPages - 1, safeMobileTeachersPage + 1),
                )
              }
              aria-label={tc('nextCardsPage')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
