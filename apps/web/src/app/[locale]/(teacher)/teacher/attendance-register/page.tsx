'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui';
import { useGroups } from '@/features/groups';
import { useLessons } from '@/features/lessons';
import { useStudents } from '@/features/students';
import {
  useLessonAttendance,
  useMarkBulkAttendance,
  type StudentWithAttendance,
  type AbsenceType,
} from '@/features/attendance';
import { cn } from '@/shared/lib/utils';

type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified' | 'not_marked';

interface AttendanceState {
  studentId: string;
  isPresent: boolean;
  absenceType?: AbsenceType;
}

function AttendanceButton({
  status,
  onClick,
  disabled,
}: {
  status: AttendanceStatus;
  onClick: () => void;
  disabled?: boolean;
}) {
  const styles: Record<AttendanceStatus, { bg: string; activeBg: string; icon: string; label: string }> = {
    present: { bg: 'bg-green-100', activeBg: 'bg-green-500', icon: '✓', label: 'Present' },
    absent_justified: { bg: 'bg-yellow-100', activeBg: 'bg-yellow-500', icon: 'J', label: 'Justified' },
    absent_unjustified: { bg: 'bg-red-100', activeBg: 'bg-red-500', icon: '✗', label: 'Unjustified' },
    not_marked: { bg: 'bg-slate-100', activeBg: 'bg-slate-300', icon: '?', label: 'Not Marked' },
  };

  const style = styles[status];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-12 h-12 rounded-lg flex items-center justify-center font-bold transition-all text-white',
        style.activeBg,
        'hover:opacity-80 disabled:opacity-50',
        status === 'not_marked' && 'text-slate-600'
      )}
      title={style.label}
    >
      {style.icon}
    </button>
  );
}

function AttendanceRow({
  student,
  currentStatus,
  onStatusChange,
  disabled,
}: {
  student: StudentWithAttendance;
  currentStatus: AttendanceStatus;
  onStatusChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
}) {
  const initials = `${student.student.user.firstName[0] || ''}${student.student.user.lastName[0] || ''}` || '?';

  const cycleStatus = () => {
    const statuses: AttendanceStatus[] = ['present', 'absent_justified', 'absent_unjustified'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    onStatusChange(statuses[nextIndex]);
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
          {initials}
        </div>
        <div>
          <p className="font-medium text-slate-800">
            {student.student.user.firstName} {student.student.user.lastName}
          </p>
          <p className="text-xs text-slate-500">
            {currentStatus === 'present' && 'Present'}
            {currentStatus === 'absent_justified' && 'Absent (Justified)'}
            {currentStatus === 'absent_unjustified' && 'Absent (Unjustified)'}
            {currentStatus === 'not_marked' && 'Not marked'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AttendanceButton
          status={currentStatus}
          onClick={cycleStatus}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default function TeacherAttendanceRegisterPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [attendanceStates, setAttendanceStates] = useState<Record<string, AttendanceState>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch teacher's groups (backend filters automatically)
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ take: 100, isActive: true });
  const groups = groupsData?.items || [];

  // Fetch lessons for selected group and date
  const selectedDateStart = selectedDate ? new Date(selectedDate + 'T00:00:00').toISOString() : undefined;
  const selectedDateEnd = selectedDate ? new Date(selectedDate + 'T23:59:59').toISOString() : undefined;

  const { data: lessonsData, isLoading: isLoadingLessons } = useLessons({
    groupId: selectedGroupId || undefined,
    dateFrom: selectedDateStart,
    dateTo: selectedDateEnd,
    take: 50,
  });
  const lessons = lessonsData?.items || [];

  // Fetch students for selected group
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents({
    groupId: selectedGroupId || undefined,
    take: 100,
  });
  const students = studentsData?.items || [];

  // Fetch attendance for selected lesson
  const { data: attendanceData, isLoading: isLoadingAttendance } = useLessonAttendance(
    selectedLessonId || '',
    !!selectedLessonId
  );

  const markBulkAttendance = useMarkBulkAttendance();

  // Initialize attendance states when data loads
  useEffect(() => {
    if (attendanceData?.studentsWithAttendance) {
      const states: Record<string, AttendanceState> = {};
      attendanceData.studentsWithAttendance.forEach((s) => {
        if (s.attendance) {
          states[s.student.id] = {
            studentId: s.student.id,
            isPresent: s.attendance.isPresent,
            absenceType: s.attendance.absenceType || undefined,
          };
        }
      });
      setAttendanceStates(states);
      setHasChanges(false);
    } else if (students.length > 0 && selectedLessonId) {
      // Initialize with not marked if lesson exists but no attendance
      const states: Record<string, AttendanceState> = {};
      students.forEach((student) => {
        states[student.id] = {
          studentId: student.id,
          isPresent: false,
        };
      });
      setAttendanceStates(states);
      setHasChanges(false);
    }
  }, [attendanceData, students, selectedLessonId]);

  // Auto-select first lesson if available
  useEffect(() => {
    if (lessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(lessons[0].id);
    } else if (lessons.length === 0) {
      setSelectedLessonId(null);
    }
  }, [lessons, selectedLessonId]);

  const getAttendanceStatus = (studentId: string): AttendanceStatus => {
    const state = attendanceStates[studentId];
    if (!state) return 'not_marked';
    if (state.isPresent) return 'present';
    if (state.absenceType === 'JUSTIFIED') return 'absent_justified';
    return 'absent_unjustified';
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceStates((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        isPresent: status === 'present',
        absenceType:
          status === 'absent_justified' ? 'JUSTIFIED' : status === 'absent_unjustified' ? 'UNJUSTIFIED' : undefined,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveAttendance = async () => {
    if (!selectedLessonId) {
      alert('Please select a lesson/session');
      return;
    }

    if (students.length === 0) {
      alert('No students found for this group');
      return;
    }

    const attendances = students.map((student) => {
      const state = attendanceStates[student.id];
      return {
        studentId: student.id,
        isPresent: state?.isPresent ?? false,
        absenceType: state?.absenceType,
      };
    });

    try {
      await markBulkAttendance.mutateAsync({
        lessonId: selectedLessonId,
        attendances,
      });
      setHasChanges(false);
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Failed to save attendance:', error);
      alert('Error saving attendance. Please try again.');
    }
  };

  const handleMarkAllPresent = () => {
    if (students.length === 0) return;
    const states: Record<string, AttendanceState> = {};
    students.forEach((student) => {
      states[student.id] = {
        studentId: student.id,
        isPresent: true,
      };
    });
    setAttendanceStates(states);
    setHasChanges(true);
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);

  // Build students with attendance for display
  const studentsWithAttendance: StudentWithAttendance[] = students.map((student) => {
    const attendance = attendanceData?.studentsWithAttendance.find((s) => s.student.id === student.id)?.attendance;
    return {
      student: {
        id: student.id,
        user: {
          id: student.user.id,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          avatarUrl: student.user.avatarUrl,
        },
      },
      attendance: attendance || null,
    };
  });

  const presentCount = Object.values(attendanceStates).filter((s) => s.isPresent).length;
  const absentCount = Object.values(attendanceStates).filter((s) => !s.isPresent).length;
  const notMarkedCount = students.length - Object.keys(attendanceStates).length;

  return (
    <DashboardLayout title="Attendance Register" subtitle="Mark and manage student attendance">
      <div className="space-y-6">
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
                  setSelectedLessonId(null);
                  setAttendanceStates({});
                  setHasChanges(false);
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

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedLessonId(null);
                  setAttendanceStates({});
                  setHasChanges(false);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedGroupId}
              />
            </div>

            {/* Lesson/Session Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Session</label>
              <select
                value={selectedLessonId || ''}
                onChange={(e) => {
                  setSelectedLessonId(e.target.value || null);
                  setAttendanceStates({});
                  setHasChanges(false);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedGroupId || isLoadingLessons || lessons.length === 0}
              >
                <option value="">-- Select Session --</option>
                {lessons.map((lesson) => {
                  const date = new Date(lesson.scheduledAt);
                  return (
                    <option key={lesson.id} value={lesson.id}>
                      {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {lesson.topic && ` - ${lesson.topic}`}
                    </option>
                  );
                })}
              </select>
              {selectedGroupId && !isLoadingLessons && lessons.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">No lessons found for this date</p>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Marking Section */}
        {selectedGroupId && selectedLessonId ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{selectedGroup?.name}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedLesson &&
                      new Date(selectedLesson.scheduledAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleMarkAllPresent}
                    variant="outline"
                    className="text-sm"
                    disabled={isLoadingAttendance || students.length === 0}
                  >
                    Mark All Present
                  </Button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-green-500 rounded text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-yellow-500 rounded text-white flex items-center justify-center text-[10px]">
                    J
                  </span>
                  <span>Justified</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-red-500 rounded text-white flex items-center justify-center text-[10px]">
                    ✗
                  </span>
                  <span>Unjustified</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-slate-600">
                  <span className="font-medium">{students.length}</span> students
                </span>
                <span className="text-green-600">
                  <span className="font-medium">{presentCount}</span> present
                </span>
                <span className="text-red-600">
                  <span className="font-medium">{absentCount}</span> absent
                </span>
                {notMarkedCount > 0 && (
                  <span className="text-slate-500">
                    <span className="font-medium">{notMarkedCount}</span> not marked
                  </span>
                )}
              </div>
            </div>

            {/* Students List */}
            {isLoadingAttendance ? (
              <div className="p-8">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-slate-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-40 mb-2" />
                        <div className="h-3 bg-slate-200 rounded w-24" />
                      </div>
                      <div className="w-12 h-12 bg-slate-200 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            ) : studentsWithAttendance.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No students found in this group</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto p-6">
                {studentsWithAttendance.map((s) => (
                  <AttendanceRow
                    key={s.student.id}
                    student={s}
                    currentStatus={getAttendanceStatus(s.student.id)}
                    onStatusChange={(status) => handleStatusChange(s.student.id, status)}
                    disabled={markBulkAttendance.isPending}
                  />
                ))}
              </div>
            )}

            {/* Save Button */}
            {hasChanges && (
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">You have unsaved changes</p>
                  <Button
                    onClick={handleSaveAttendance}
                    disabled={markBulkAttendance.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {markBulkAttendance.isPending ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </div>
              </div>
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
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Select Group, Date, and Session</h3>
            <p className="text-sm text-slate-500">
              Please select a group, date, and session to mark attendance
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

