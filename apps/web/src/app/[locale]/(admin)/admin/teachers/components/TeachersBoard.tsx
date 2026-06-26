'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TeacherCard } from './TeacherCard';
import { TeachersCentersStrip } from './TeachersCentersStrip';
import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';
import { useTranslations, type useTranslations as useTranslationsType } from 'next-intl';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { cn } from '@/shared/lib/utils';


interface TeachersBoardProps {
  teachersByCenter: Record<string, Teacher[]>;
  centersData?: Array<Center>;
  activeCenterTabId: string | null;
  onSelectCenter: (centerId: string) => void;
  uniqueTeachersCount: number;
  isLoading: boolean;
  searchQuery: string;
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
    requestAnimationFrame(() => {
      mobileTeachersStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const selectedCenter = sortedCenters.find((center) => center.id === activeCenterTabId);
  const panelTitle = activeCenterTabId === 'unassigned' ? tc('unassigned') : selectedCenter?.name || tc('center');

  return (
    <div className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm sm:border">
      <TeachersCentersStrip
        centers={sortedCenters}
        teachersByCenter={teachersByCenter}
        activeCenterTabId={activeCenterTabId}
        onSelectCenter={onSelectCenter}
        uniqueTeachersCount={uniqueTeachersCount}
        isLoading={isLoading}
        t={t}
        unassignedLabel={tc('unassigned')}
      />

      <div
        className="p-4 sm:p-5"
        role="tabpanel"
        aria-label={panelTitle}
      >
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
          <div className="space-y-4">
            <div ref={mobileTeachersStartRef} className="sm:hidden" />
            <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:hidden">
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
                'hidden w-full min-w-0 grid-cols-1 gap-4 sm:grid sm:grid-cols-2',
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
              <div
                className={cn(
                  'flex items-center text-sm text-[#8b8b90]',
                  isIPad ? 'justify-start gap-4' : 'justify-between sm:hidden',
                )}
              >
                <span>
                  {safeMobileTeachersPage * teachersPageSize + 1}-
                  {Math.min((safeMobileTeachersPage + 1) * teachersPageSize, selectedTeachers.length)} / {selectedTeachers.length}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                      safeMobileTeachersPage === 0
                        ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                        : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                    }`}
                    disabled={safeMobileTeachersPage === 0}
                    onClick={() => goToMobileTeachersPage(Math.max(0, safeMobileTeachersPage - 1))}
                    aria-label="Previous cards page"
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
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                      safeMobileTeachersPage >= totalMobileTeachersPages - 1
                        ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                        : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                    }`}
                    disabled={safeMobileTeachersPage >= totalMobileTeachersPages - 1}
                    onClick={() =>
                      goToMobileTeachersPage(
                        Math.min(totalMobileTeachersPages - 1, safeMobileTeachersPage + 1),
                      )
                    }
                    aria-label="Next cards page"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
