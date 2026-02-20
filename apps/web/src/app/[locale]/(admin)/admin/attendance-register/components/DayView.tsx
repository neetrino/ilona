'use client';

import { AttendanceGrid } from '@/shared/components/attendance';
import { AttendanceContextHeader } from './AttendanceContextHeader';
import { AttendanceLoadingState } from './AttendanceLoadingState';
import { AttendanceErrorState } from './AttendanceErrorState';
import { AttendanceEmptyState } from './AttendanceEmptyState';
import type { Group } from '@/features/groups';
import type { Lesson } from '@/features/lessons';
import type { Student } from '@/features/students';
import type { AttendanceCell } from '../hooks/useAttendanceData';
import type { AbsenceType } from '@/features/attendance';

interface DayViewProps {
  group: Group | undefined;
  groups?: Group[]; // All groups for multi-group support (optional for backward compatibility)
  selectedGroupIds?: string[]; // Selected group IDs (optional for backward compatibility)
  currentDate: Date;
  students: Student[];
  filteredLessons: Lesson[];
  attendanceData: Record<string, Record<string, AttendanceCell>>;
  attendanceQueries: Array<{ isLoading: boolean; isError: boolean }>;
  isLoadingLessons: boolean;
  isLoadingStudents: boolean;
  isLoadingAttendance: boolean;
  savingLessons: Record<string, boolean>;
  hasUnsavedChanges: boolean;
  effectiveDateRange: { from: string; to: string };
  onLessonSave: (
    lessonId: string,
    attendances: Array<{ studentId: string; isPresent: boolean; absenceType?: AbsenceType }>
  ) => Promise<void>;
  onSaveSuccess: (id: string) => void;
  onSaveError: (id: string, error: string) => void;
  onUnsavedChangesChange: (hasUnsavedChanges: boolean) => void;
  isCurrentDateToday: boolean;
}

export function DayView({
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
  effectiveDateRange,
  onLessonSave,
  onSaveSuccess,
  onSaveError,
  onUnsavedChangesChange,
  isCurrentDateToday,
}: DayViewProps) {
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
  }, {} as Record<string, Student[]>);

  // Get selected groups in order
  // Fallback to single group if selectedGroupIds is not provided (backward compatibility)
  const safeSelectedGroupIds = selectedGroupIds ?? (group ? [group.id] : []);
  const safeGroups = groups ?? (group ? [group] : []);
  const selectedGroups = safeSelectedGroupIds
    .map(id => safeGroups.find(g => g.id === id))
    .filter((g): g is Group => g !== undefined);

  // If only one group or no multi-select, show single view (backward compatibility)
  if (selectedGroups.length <= 1) {
    return (
      <div className="bg-white rounded-xl border-2 border-slate-300 p-6 shadow-sm">
        <AttendanceContextHeader
          group={group || null}
          date={currentDate}
          viewMode="day"
          lessonsCount={filteredLessons.length}
          studentsCount={students.length}
          hasUnsavedChanges={hasUnsavedChanges}
          isCurrentDateToday={isCurrentDateToday}
        />

        {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
          <AttendanceLoadingState isLoadingAttendance={isLoadingAttendance} />
        ) : attendanceQueries.some((q) => q.isError) ? (
          <AttendanceErrorState />
        ) : filteredLessons.length === 0 ? (
          <AttendanceEmptyState date={currentDate} />
        ) : (
          <AttendanceGrid
            students={students.map((s) => ({
              id: s.id,
              user: {
                id: s.user.id,
                firstName: s.user.firstName,
                lastName: s.user.lastName,
                avatarUrl: s.user.avatarUrl,
              },
            }))}
            lessons={filteredLessons}
            initialAttendance={attendanceData}
            onLessonSave={onLessonSave}
            isLoading={isLoadingAttendance}
            isSaving={savingLessons}
            dateRange={effectiveDateRange}
            onSaveSuccess={onSaveSuccess}
            onSaveError={onSaveError}
            onUnsavedChangesChange={onUnsavedChangesChange}
          />
        )}
      </div>
    );
  }

  // Multi-group view: show each group separately
  return (
    <div className="space-y-6">
      {selectedGroups.map((selectedGroup) => {
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
          <div key={selectedGroup.id} className="bg-white rounded-xl border-2 border-slate-300 p-6 shadow-sm">
            <AttendanceContextHeader
              group={selectedGroup}
              date={currentDate}
              viewMode="day"
              lessonsCount={groupLessons.length}
              studentsCount={groupStudents.length}
              hasUnsavedChanges={hasUnsavedChanges}
              isCurrentDateToday={isCurrentDateToday}
            />

            {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
              <AttendanceLoadingState isLoadingAttendance={isLoadingAttendance} />
            ) : attendanceQueries.some((q) => q.isError) ? (
              <AttendanceErrorState />
            ) : groupLessons.length === 0 ? (
              <AttendanceEmptyState date={currentDate} />
            ) : (
              <AttendanceGrid
                students={groupStudents.map((s) => ({
                  id: s.id,
                  user: {
                    id: s.user.id,
                    firstName: s.user.firstName,
                    lastName: s.user.lastName,
                    avatarUrl: s.user.avatarUrl,
                  },
                }))}
                lessons={groupLessons}
                initialAttendance={groupAttendanceData}
                onLessonSave={onLessonSave}
                isLoading={isLoadingAttendance}
                isSaving={savingLessons}
                dateRange={effectiveDateRange}
                onSaveSuccess={onSaveSuccess}
                onSaveError={onSaveError}
                onUnsavedChangesChange={onUnsavedChangesChange}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

