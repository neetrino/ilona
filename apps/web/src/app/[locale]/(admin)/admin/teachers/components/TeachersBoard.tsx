'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TeacherCard } from './TeacherCard';
import { TeachersCentersStrip } from './TeachersCentersStrip';
import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';
import { useTranslations, type useTranslations as useTranslationsType } from 'next-intl';
import { AdminPaginationControls } from '@/shared/components/ui';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { cn } from '@/shared/lib/utils';
import { scrollListStartSoon } from '@/shared/lib/scroll-element-to-list-start';


interface TeachersBoardProps {
  teachersByCenter: Record<string, Teacher[]>;
  centersData?: Array<Center>;
  activeCenterTabId: string | null;
  onSelectCenter: (centerId: string) => void;
  uniqueTeachersCount: number;
  isLoading: boolean;
  searchQuery: string;
  onTotalClick?: () => void;
  onEdit: (teacher: Teacher) => void;
  /** Opens teacher details in CRM-style modal */
  onCardClick?: (teacher: Teacher) => void;
  t: ReturnType<typeof useTranslationsType<'teachers'>>;
}

const MOBILE_TEACHERS_PAGE_SIZE = 5;
const IPAD_TEACHERS_PAGE_SIZE = 10;

export function TeachersBoard({
  teachersByCenter,
  centersData,
  activeCenterTabId,
  onSelectCenter,
  uniqueTeachersCount,
  isLoading,
  searchQuery,
  onTotalClick,
  onEdit,
  onCardClick,
  t,
}: TeachersBoardProps) {
  const tc = useTranslations('common');
  const [mobileTeachersPage, setMobileTeachersPage] = useState(0);
  const isIPad = useIsIPad();
  const mobileTeachersStartRef = useRef<HTMLDivElement | null>(null);
  const sortedCenters = centersData ?? [];
  const hasUnassigned = (teachersByCenter.unassigned?.length || 0) > 0;

  const selectedTeachers = useMemo(
    () =>
      activeCenterTabId === 'unassigned'
        ? teachersByCenter.unassigned || []
        : teachersByCenter[activeCenterTabId || ''] || [],
    [activeCenterTabId, teachersByCenter],
  );
  const teachersPageSize = isIPad ? IPAD_TEACHERS_PAGE_SIZE : MOBILE_TEACHERS_PAGE_SIZE;
  const totalMobileTeachersPages = Math.max(
    1,
    Math.ceil(selectedTeachers.length / teachersPageSize),
  );
  const safeMobileTeachersPage = Math.min(Math.max(0, mobileTeachersPage), totalMobileTeachersPages - 1);
  const paginatedTeachers = useMemo(
    () =>
      selectedTeachers.slice(
        safeMobileTeachersPage * teachersPageSize,
        safeMobileTeachersPage * teachersPageSize + teachersPageSize,
      ),
    [safeMobileTeachersPage, selectedTeachers, teachersPageSize],
  );
  useEffect(() => {
    setMobileTeachersPage(0);
  }, [activeCenterTabId, searchQuery, selectedTeachers.length]);

  useEffect(() => {
    setMobileTeachersPage(0);
  }, [isIPad]);

  const goToMobileTeachersPage = (nextPage: number) => {
    setMobileTeachersPage(nextPage);
    scrollListStartSoon(mobileTeachersStartRef.current);
  };

  const selectedCenter = sortedCenters.find((center) => center.id === activeCenterTabId);
  const panelTitle = activeCenterTabId === 'unassigned' ? tc('unassigned') : selectedCenter?.name || tc('center');

  const teachersPanelContent = (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-[#8b8b90]">{t('loadingTeacherInfo')}</div>
        </div>
      ) : searchQuery &&
        sortedCenters.every((center) => (teachersByCenter[center.id] || []).length === 0) &&
        !hasUnassigned ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-[#8b8b90]">{t('noTeachersMatch')}</div>
        </div>
      ) : sortedCenters.length === 0 && !hasUnassigned ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-[#8b8b90]">{t('noTeachersFound')}</div>
        </div>
      ) : !activeCenterTabId ? (
        <div className="rounded-lg border border-dashed border-[rgba(14,14,16,0.07)] bg-[#fafafa]/60 py-12 text-center">
          <p className="text-sm text-[#8b8b90]">{t('noTeachersFound')}</p>
        </div>
      ) : selectedTeachers.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-[#8b8b90]">
          {activeCenterTabId === 'unassigned' ? t('noUnassignedTeachers') : t('noTeachersInThisCenter')}
        </div>
      ) : (
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
              isIPad
                ? 'lg:grid-cols-2 xl:grid-cols-2'
                : 'lg:grid-cols-4 xl:grid-cols-4',
            )}
          >
            {(isIPad ? paginatedTeachers : selectedTeachers).map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onEdit={() => onEdit(teacher)}
                onCardClick={onCardClick}
              />
            ))}
          </div>
          {selectedTeachers.length > teachersPageSize && (
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
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-3 sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-100 sm:bg-white sm:shadow-sm sm:gap-0">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-none sm:border-0 sm:shadow-none">
        <TeachersCentersStrip
          centers={sortedCenters}
          teachersByCenter={teachersByCenter}
          activeCenterTabId={activeCenterTabId}
          onSelectCenter={onSelectCenter}
          uniqueTeachersCount={uniqueTeachersCount}
          isLoading={isLoading}
          onTotalClick={onTotalClick}
          t={t}
          unassignedLabel={tc('unassigned')}
        />
      </div>

      <div
        role="tabpanel"
        aria-label={panelTitle}
        className="min-w-0 sm:p-5"
      >
        {teachersPanelContent}
      </div>
    </div>
  );
}
