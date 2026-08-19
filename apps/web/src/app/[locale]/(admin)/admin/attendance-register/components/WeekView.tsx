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
import {
  filterGridStudentsForGroup,
} from '../utils/group-students.util';
import type { AbsenceType } from '@/features/attendance';
import { AdminListPagination } from '@/shared/components/ui';
import { ATTENDANCE_GROUP_CARD_30_CLASS } from '@/shared/components/attendance/attendance-button-theme';

const WEEK_GROUP_CARDS_PAGE_SIZE = 5;

interface WeekViewProps {
  group: Group | undefined;
  groups?: Group[];
  selectedGroupIds?: string[];
  studentsByGroup: Record<string, TeacherAssignedItem[]>;
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
  studentsByGroup: rosterByGroup,
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
  const safeSelectedGroupIds = selectedGroupIds ?? (group ? [group.id] : []);
  const safeGroups = groups ?? (group ? [group] : []);
  const selectedGroups = safeSelectedGroupIds
    .map((id) => safeGroups.find((g) => g.id === id))
    .filter((g): g is Group => g !== undefined);
  const mobileCardsPageSize = WEEK_GROUP_CARDS_PAGE_SIZE;

  const lessonsByGroup = useMemo(
    () =>
      filteredLessons.reduce((acc, lesson) => {
        if (!acc[lesson.groupId]) {
          acc[lesson.groupId] = [];
        }
        acc[lesson.groupId].push(lesson);
        return acc;
      }, {} as Record<string, Lesson[]>),
    [filteredLessons],
  );

  const studentsByGroup = useMemo(
    () =>
      safeSelectedGroupIds.reduce(
        (acc, groupId) => {
          acc[groupId] = rosterByGroup[groupId] ?? [];
          return acc;
        },
        {} as Record<string, TeacherAssignedItem[]>,
      ),
    [rosterByGroup, safeSelectedGroupIds],
  );

  const primaryGroup = group ?? selectedGroups[0] ?? null;
  const primaryGroupRoster = primaryGroup ? studentsByGroup[primaryGroup.id] ?? [] : [];
  const primaryGroupStudents = primaryGroup
    ? filterGridStudentsForGroup(students, primaryGroupRoster)
    : [];
  const primaryGroupLessons = primaryGroup
    ? filteredLessons.filter((lesson) => lesson.groupId === primaryGroup.id)
    : filteredLessons;

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
      <div className={ATTENDANCE_GROUP_CARD_30_CLASS}>
        <AttendanceContextHeader
          group={primaryGroup}
          weekRange={formatWeekRange(currentDate)}
          viewMode="week"
          lessonsCount={primaryGroupLessons.length}
          studentsCount={primaryGroupRoster.length}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
          <AttendanceLoadingState isLoadingAttendance={isLoadingAttendance} />
        ) : attendanceQueries.some((q) => q.isError) ? (
          <AttendanceErrorState />
        ) : (
          <>
                <div className="mt-3 md:hidden">
              <WeekLessonTable weekDates={weekDates} lessons={primaryGroupLessons} weekRangeLabel={formatWeekRange(currentDate)} />
            </div>
            <div className="hidden md:block">
              <WeekAttendanceGrid
                students={primaryGroupStudents.map(toAttendanceRow)}
                lessons={primaryGroupLessons}
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
          const groupRoster = studentsByGroup[selectedGroup.id] || [];
          const groupGridStudents = filterGridStudentsForGroup(students, groupRoster);
          
          // Filter attendance data for this group's lessons
          const groupAttendanceData: Record<string, Record<string, AttendanceCell>> = {};
          groupLessons.forEach(lesson => {
            if (attendanceData[lesson.id]) {
              groupAttendanceData[lesson.id] = attendanceData[lesson.id];
            }
          });

          return (
            <div key={selectedGroup.id} className={ATTENDANCE_GROUP_CARD_30_CLASS}>
              <AttendanceContextHeader
                group={selectedGroup}
                weekRange={formatWeekRange(currentDate)}
                viewMode="week"
                lessonsCount={groupLessons.length}
                studentsCount={groupRoster.length}
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
                      students={groupGridStudents.map(toAttendanceRow)}
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
          align="start"
        />
      </div>

      <div className="hidden space-y-6 md:block">
      <div ref={desktopCardsStartRef} />
      {desktopPaginatedGroups.map((selectedGroup) => {
        const groupLessons = lessonsByGroup[selectedGroup.id] || [];
        const groupRoster = studentsByGroup[selectedGroup.id] || [];
        const groupGridStudents = filterGridStudentsForGroup(students, groupRoster);
        
        // Filter attendance data for this group's lessons
        const groupAttendanceData: Record<string, Record<string, AttendanceCell>> = {};
        groupLessons.forEach(lesson => {
          if (attendanceData[lesson.id]) {
            groupAttendanceData[lesson.id] = attendanceData[lesson.id];
          }
        });

        return (
          <div key={selectedGroup.id} className={ATTENDANCE_GROUP_CARD_30_CLASS}>
            <AttendanceContextHeader
              group={selectedGroup}
              weekRange={formatWeekRange(currentDate)}
              viewMode="week"
              lessonsCount={groupLessons.length}
              studentsCount={groupRoster.length}
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
                    students={groupGridStudents.map(toAttendanceRow)}
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

