'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { AttendanceGrid } from '@/shared/components/attendance';
import { useGroups } from '@/features/groups';
import { useLessons } from '@/features/lessons';
import { useStudents } from '@/features/students';
import { useMarkBulkAttendance, attendanceKeys, type AbsenceType } from '@/features/attendance';
import { useQueries } from '@tanstack/react-query';
import { fetchLessonAttendance } from '@/features/attendance/api/attendance.api';

type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified' | 'not_marked';

interface AttendanceCell {
  studentId: string;
  lessonId: string;
  status: AttendanceStatus;
  isPresent: boolean;
  absenceType?: AbsenceType;
}

export default function TeacherAttendanceRegisterPage() {
  const router = useRouter();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to last 7 days
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [savingLessons, setSavingLessons] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveMessages, setSaveMessages] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch teacher's groups (backend filters automatically)
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ take: 100, isActive: true });
  const groups = groupsData?.items || [];

  // Fetch lessons for selected group and date range
  const dateFromISO = dateFrom ? new Date(dateFrom + 'T00:00:00').toISOString() : undefined;
  const dateToISO = dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined;

  const { data: lessonsData, isLoading: isLoadingLessons } = useLessons({
    groupId: selectedGroupId || undefined,
    dateFrom: dateFromISO,
    dateTo: dateToISO,
    take: 100,
  });
  const lessons = lessonsData?.items || [];

  // Fetch students for selected group
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents({
    groupId: selectedGroupId || undefined,
    take: 100,
  });
  const students = studentsData?.items || [];

  // Fetch attendance for all lessons in parallel
  const attendanceQueries = useQueries({
    queries: lessons.map((lesson) => ({
      queryKey: attendanceKeys.lesson(lesson.id),
      queryFn: () => fetchLessonAttendance(lesson.id),
      enabled: !!selectedGroupId && lessons.length > 0,
    })),
  });

  const isLoadingAttendance = attendanceQueries.some((q) => q.isLoading);

  // Transform attendance data for grid
  const attendanceData = useMemo(() => {
    const data: Record<string, Record<string, AttendanceCell>> = {};

    lessons.forEach((lesson, index) => {
      const query = attendanceQueries[index];
      if (query?.data?.studentsWithAttendance) {
        const lessonData: Record<string, AttendanceCell> = {};
        query.data.studentsWithAttendance.forEach((s) => {
          if (s.attendance) {
            let status: AttendanceStatus = 'not_marked';
            if (s.attendance.isPresent) {
              status = 'present';
            } else if (s.attendance.absenceType === 'JUSTIFIED') {
              status = 'absent_justified';
            } else if (s.attendance.absenceType === 'UNJUSTIFIED') {
              status = 'absent_unjustified';
            }

            lessonData[s.student.id] = {
              studentId: s.student.id,
              lessonId: lesson.id,
              status,
              isPresent: s.attendance.isPresent,
              absenceType: s.attendance.absenceType || undefined,
            };
          }
        });
        data[lesson.id] = lessonData;
      }
    });

    return data;
  }, [lessons, attendanceQueries]);

  const markBulkAttendance = useMarkBulkAttendance();

  // Handle lesson save
  const handleLessonSave = async (
    lessonId: string,
    attendances: Array<{ studentId: string; isPresent: boolean; absenceType?: AbsenceType }>
  ) => {
    setSavingLessons((prev) => ({ ...prev, [lessonId]: true }));
    try {
      await markBulkAttendance.mutateAsync({
        lessonId,
        attendances,
      });
    } finally {
      setSavingLessons((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
    }
  };

  // Handle save success
  const handleSaveSuccess = (lessonId: string) => {
    setSaveMessages({ type: 'success', message: 'Attendance saved successfully' });
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      setSaveMessages(null);
    }, 3000);
  };

  // Handle save error
  const handleSaveError = (lessonId: string, error: string) => {
    setSaveMessages({ type: 'error', message: `Failed to save attendance: ${error}` });
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      setSaveMessages(null);
    }, 5000);
  };

  // Cleanup message timeout
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Handle navigation with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleRouteChange = () => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
        );
        if (!confirmed) {
          throw new Error('Navigation cancelled');
        }
      }
    };

    // Note: Next.js App Router doesn't have a built-in way to intercept navigation
    // The beforeunload event in AttendanceGrid handles browser navigation
    // For programmatic navigation, we rely on the confirmation prompt
  }, [hasUnsavedChanges]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // Calculate statistics
  const stats = useMemo(() => {
    let total = 0;
    let present = 0;
    let absent = 0;
    let notMarked = 0;

    students.forEach((student) => {
      lessons.forEach((lesson) => {
        total++;
        const cell = attendanceData[lesson.id]?.[student.id];
        if (!cell) {
          notMarked++;
        } else if (cell.isPresent) {
          present++;
        } else {
          absent++;
        }
      });
    });

    return { total, present, absent, notMarked };
  }, [students, lessons, attendanceData]);

  return (
    <DashboardLayout title="Attendance Register" subtitle="Mark and manage student attendance">
      <div className="space-y-6">
        {/* Save messages */}
        {saveMessages && (
          <div
            className={cn(
              'rounded-lg px-4 py-3 text-sm font-medium',
              saveMessages.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            )}
          >
            {saveMessages.message}
          </div>
        )}
        {/* Selection Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Group Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Group</label>
              <select
                value={selectedGroupId || ''}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value || null);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoadingGroups}
              >
                <option value="">-- Select Group --</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group.level && `(${group.level})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedGroupId}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedGroupId}
              />
            </div>
          </div>
        </div>

        {/* Statistics */}
        {selectedGroupId && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-600">Total Sessions</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-600">Present</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{stats.present}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-600">Absent</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{stats.absent}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-600">Not Marked</div>
              <div className="text-2xl font-bold text-slate-400 mt-1">{stats.notMarked}</div>
            </div>
          </div>
        )}

        {/* Attendance Grid */}
        {selectedGroupId && students.length > 0 ? (
          <div className="bg-white rounded-xl border-2 border-slate-300 p-6 shadow-sm">
            {/* Context Indicators */}
            <div className="mb-6 pb-4 border-b-2 border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Selected Group:</span>
                    <span className="text-xl font-bold text-slate-900">{selectedGroup?.name}</span>
                    {selectedGroup?.level && (
                      <span className="text-sm font-medium text-slate-600">({selectedGroup.level})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>
                      <span className="font-semibold">{lessons.length}</span> {lessons.length === 1 ? 'session' : 'sessions'}
                    </span>
                    <span>•</span>
                    <span>
                      <span className="font-semibold">{students.length}</span> {students.length === 1 ? 'student' : 'students'}
                    </span>
                    <span>•</span>
                    <span>
                      Date range: <span className="font-semibold">{dateFrom}</span> to <span className="font-semibold">{dateTo}</span>
                    </span>
                  </div>
                </div>
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border-2 border-amber-400 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse"></div>
                    <span className="text-sm font-semibold text-amber-800">Unsaved Changes</span>
                  </div>
                )}
              </div>
            </div>

            {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-4 text-sm text-slate-500">Loading attendance data...</p>
                </div>
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center p-12">
                <p className="text-sm text-slate-500">No lessons found for the selected date range</p>
              </div>
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
                lessons={lessons}
                initialAttendance={attendanceData}
                onLessonSave={handleLessonSave}
                isLoading={isLoadingAttendance}
                isSaving={savingLessons}
                dateRange={{ from: dateFrom, to: dateTo }}
                onSaveSuccess={handleSaveSuccess}
                onSaveError={handleSaveError}
                onUnsavedChangesChange={setHasUnsavedChanges}
              />
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Select Group and Date Range</h3>
            <p className="text-sm text-slate-500">Please select a group and date range to view attendance</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
