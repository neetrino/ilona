'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { WeekAttendanceGrid } from '@/shared/components/attendance';
import { AttendanceContextHeader } from './AttendanceContextHeader';
import { AttendanceLoadingState } from './AttendanceLoadingState';
import { AttendanceErrorState } from './AttendanceErrorState';
import { formatWeekRange } from '@/features/attendance/utils/dateUtils';
import { WeekLessonTable } from './WeekLessonTable';
import type { Group } from '@/features/groups';
import type { Lesson } from '@/features/lessons';
import type { TeacherAssignedItem } from '@/features/students';
import type { AttendanceCell } from '../hooks/useAttendanceData';
import { toAttendanceRow } from '../hooks/useAttendanceData';
import type { AbsenceType } from '@/features/attendance';
import { AdminListPagination } from '@/shared/components/ui';
import { ATTENDANCE_GROUP_CARD_CLASS } from '@/shared/components/attendance/attendance-button-theme';

const WEEK_GROUP_CARDS_PAGE_SIZE = 5;

interface WeekViewProps {
  group: Group | undefined;
  groups?: Group[]; // All groups for multi-group support (optional for backward compatibility)
  selectedGroupIds?: string[]; // Selected group IDs (optional for backward compatibility)
  currentDate: Date;
  students: TeacherAssignedItem[];
  filteredLessons: Lesson[];
  attendanceData: Record<string, Record<string, AttendanceCell>>;
  attendanceQueries: Array<{ isLoading: boolean; isError: boolean }>;
  isLoadingLessons: boolean;
  isLoadingStudents: boolean;
  isLoadingAttendance: boolean;
  savingLessons: Record<string, boolean>;
  hasUnsavedChanges: boolean;
  weekDates: Date[];
  onDaySave: (
    date: string,
    attendances: Array<{ studentId: string; lessonId: string; isPresent: boolean; absenceType?: AbsenceType; note?: string }>
  ) => Promise<void>;
  onSaveSuccess: (id: string) => void;
  onSaveError: (id: string, error: string) => void;
  onUnsavedChangesChange: (hasUnsavedChanges: boolean) => void;
}

export function WeekView({
  group,
  groups,
  selectedGroupIds,
  currentDate,
  students,
  filteredLessons,
  attendanceData,
  attendanceQueries,
  isLoadingLessons,
  isLoadingStudents,
  isLoadingAttendance,
  savingLessons,
  hasUnsavedChanges,
  weekDates,
  onDaySave,
  onSaveSuccess,
  onSaveError,
  onUnsavedChangesChange,
}: WeekViewProps) {
  const tCommon = useTranslations('common');
  // Group lessons and students by groupId
  const lessonsByGroup = filteredLessons.reduce((acc, lesson) => {
    const groupId = lesson.groupId;
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  const studentsByGroup = students.reduce((acc, student) => {
    const groupId = student.groupId || student.group?.id;
    if (!groupId) return acc;
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(student);
    return acc;
  }, {} as Record<string, TeacherAssignedItem[]>);

  // Get selected groups in order
  // Fallback to single group if selectedGroupIds is not provided (backward compatibility)
  const safeSelectedGroupIds = selectedGroupIds ?? (group ? [group.id] : []);
  const safeGroups = groups ?? (group ? [group] : []);
  const selectedGroups = safeSelectedGroupIds
    .map(id => safeGroups.find(g => g.id === id))
    .filter((g): g is Group => g !== undefined);
  const mobileCardsPageSize = WEEK_GROUP_CARDS_PAGE_SIZE;
  const [mobileCardPage, setMobileCardPage] = useState(0);
  const [desktopCardPage, setDesktopCardPage] = useState(0);
  const mobileCardsStartRef = useRef<HTMLDivElement | null>(null);
  const desktopCardsStartRef = useRef<HTMLDivElement | null>(null);
  const totalMobileCardPages = Math.max(
    1,
    Math.ceil(selectedGroups.length / mobileCardsPageSize),
  );
  const safeMobileCardPage = Math.min(mobileCardPage, totalMobileCardPages - 1);
  const mobilePaginatedGroups = useMemo(
    () =>
      selectedGroups.slice(
        safeMobileCardPage * mobileCardsPageSize,
        safeMobileCardPage * mobileCardsPageSize + mobileCardsPageSize,
      ),
    [safeMobileCardPage, selectedGroups, mobileCardsPageSize],
  );
  const totalDesktopCardPages = Math.max(
    1,
    Math.ceil(selectedGroups.length / WEEK_GROUP_CARDS_PAGE_SIZE),
  );
  const safeDesktopCardPage = Math.min(desktopCardPage, totalDesktopCardPages - 1);
  const desktopPaginatedGroups = useMemo(
    () =>
      selectedGroups.slice(
        safeDesktopCardPage * WEEK_GROUP_CARDS_PAGE_SIZE,
        safeDesktopCardPage * WEEK_GROUP_CARDS_PAGE_SIZE + WEEK_GROUP_CARDS_PAGE_SIZE,
      ),
    [safeDesktopCardPage, selectedGroups],
  );

  const selectedGroupIdsKey = safeSelectedGroupIds.join(',');

  useEffect(() => {
    setMobileCardPage(0);
  }, [currentDate, selectedGroups.length, selectedGroupIdsKey]);

  useEffect(() => {
    setDesktopCardPage(0);
  }, [currentDate, selectedGroups.length, selectedGroupIdsKey]);

  const goToMobileCardsPage = (nextPage: number) => {
    setMobileCardPage(nextPage);
    requestAnimationFrame(() => {
      mobileCardsStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const goToDesktopCardsPage = (nextPage: number) => {
    setDesktopCardPage(nextPage);
    requestAnimationFrame(() => {
      desktopCardsStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  // If only one group or no multi-select, show single view (backward compatibility)
  if (selectedGroups.length <= 1) {
    return (
      <div className={ATTENDANCE_GROUP_CARD_CLASS}>
        <AttendanceContextHeader
          group={group || null}
          weekRange={formatWeekRange(currentDate)}
          viewMode="week"
          lessonsCount={filteredLessons.length}
          studentsCount={students.length}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
          <AttendanceLoadingState isLoadingAttendance={isLoadingAttendance} />
        ) : attendanceQueries.some((q) => q.isError) ? (
          <AttendanceErrorState />
        ) : (
          <>
                <div className="mt-3 md:hidden">
              <WeekLessonTable weekDates={weekDates} lessons={filteredLessons} weekRangeLabel={formatWeekRange(currentDate)} />
            </div>
            <div className="hidden md:block">
              <WeekAttendanceGrid
                students={students.map(toAttendanceRow)}
                lessons={filteredLessons}
                initialAttendance={attendanceData}
                onDaySave={onDaySave}
                isLoading={isLoadingAttendance}
                isSaving={savingLessons}
                weekDates={weekDates}
                onSaveSuccess={onSaveSuccess}
                onSaveError={onSaveError}
                onUnsavedChangesChange={onUnsavedChangesChange}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // Multi-group view: show each group separately
  return (
    <div className="space-y-6">
      <div className="space-y-6 md:hidden">
        <div ref={mobileCardsStartRef} />
        {mobilePaginatedGroups.map((selectedGroup) => {
          const groupLessons = lessonsByGroup[selectedGroup.id] || [];
          const groupStudents = studentsByGroup[selectedGroup.id] || [];
          
          // Filter attendance data for this group's lessons
          const groupAttendanceData: Record<string, Record<string, AttendanceCell>> = {};
          groupLessons.forEach(lesson => {
            if (attendanceData[lesson.id]) {
              groupAttendanceData[lesson.id] = attendanceData[lesson.id];
            }
          });

          return (
            <div key={selectedGroup.id} className={ATTENDANCE_GROUP_CARD_CLASS}>
              <AttendanceContextHeader
                group={selectedGroup}
                weekRange={formatWeekRange(currentDate)}
                viewMode="week"
                lessonsCount={groupLessons.length}
                studentsCount={groupStudents.length}
                hasUnsavedChanges={hasUnsavedChanges}
              />

              {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
                <AttendanceLoadingState isLoadingAttendance={isLoadingAttendance} />
              ) : attendanceQueries.some((q) => q.isError) ? (
                <AttendanceErrorState />
              ) : (
                <>
                  <div className="mt-3 md:hidden">
                    <WeekLessonTable weekDates={weekDates} lessons={groupLessons} weekRangeLabel={formatWeekRange(currentDate)} />
                  </div>
                  <div className="hidden md:block">
                    <WeekAttendanceGrid
                      students={groupStudents.map(toAttendanceRow)}
                      lessons={groupLessons}
                      initialAttendance={groupAttendanceData}
                      onDaySave={onDaySave}
                      isLoading={isLoadingAttendance}
                      isSaving={savingLessons}
                      weekDates={weekDates}
                      onSaveSuccess={onSaveSuccess}
                      onSaveError={onSaveError}
                      onUnsavedChangesChange={onUnsavedChangesChange}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}

        <AdminListPagination
          page={safeMobileCardPage}
          pageSize={mobileCardsPageSize}
          totalItems={selectedGroups.length}
          onPageChange={goToMobileCardsPage}
          previousLabel={tCommon('previousCardsPage')}
          nextLabel={tCommon('nextCardsPage')}
          align="between"
        />
      </div>

      <div className="hidden space-y-6 md:block">
      <div ref={desktopCardsStartRef} />
      {desktopPaginatedGroups.map((selectedGroup) => {
        const groupLessons = lessonsByGroup[selectedGroup.id] || [];
        const groupStudents = studentsByGroup[selectedGroup.id] || [];
        
        // Filter attendance data for this group's lessons
        const groupAttendanceData: Record<string, Record<string, AttendanceCell>> = {};
        groupLessons.forEach(lesson => {
          if (attendanceData[lesson.id]) {
            groupAttendanceData[lesson.id] = attendanceData[lesson.id];
          }
        });

        return (
          <div key={selectedGroup.id} className={ATTENDANCE_GROUP_CARD_CLASS}>
            <AttendanceContextHeader
              group={selectedGroup}
              weekRange={formatWeekRange(currentDate)}
              viewMode="week"
              lessonsCount={groupLessons.length}
              studentsCount={groupStudents.length}
              hasUnsavedChanges={hasUnsavedChanges}
            />

            {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
              <AttendanceLoadingState isLoadingAttendance={isLoadingAttendance} />
            ) : attendanceQueries.some((q) => q.isError) ? (
              <AttendanceErrorState />
            ) : (
              <>
                <div className="mt-3 md:hidden">
                  <WeekLessonTable weekDates={weekDates} lessons={groupLessons} weekRangeLabel={formatWeekRange(currentDate)} />
                </div>
                <div className="hidden md:block">
                  <WeekAttendanceGrid
                    students={groupStudents.map(toAttendanceRow)}
                    lessons={groupLessons}
                    initialAttendance={groupAttendanceData}
                    onDaySave={onDaySave}
                    isLoading={isLoadingAttendance}
                    isSaving={savingLessons}
                    weekDates={weekDates}
                    onSaveSuccess={onSaveSuccess}
                    onSaveError={onSaveError}
                    onUnsavedChangesChange={onUnsavedChangesChange}
                  />
                </div>
              </>
            )}
          </div>
        );
      })}
      <AdminListPagination
        page={safeDesktopCardPage}
        pageSize={WEEK_GROUP_CARDS_PAGE_SIZE}
        totalItems={selectedGroups.length}
        onPageChange={goToDesktopCardsPage}
        previousLabel={tCommon('previousCardsPage')}
        nextLabel={tCommon('nextCardsPage')}
      />
      </div>
    </div>
  );
}

