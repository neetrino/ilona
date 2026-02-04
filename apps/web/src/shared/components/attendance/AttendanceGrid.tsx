'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import type { Lesson } from '@/features/lessons';
import type { StudentWithAttendance, AbsenceType } from '@/features/attendance';

type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified' | 'not_marked';

interface AttendanceCell {
  studentId: string;
  lessonId: string;
  status: AttendanceStatus;
  isPresent: boolean;
  absenceType?: AbsenceType;
}

interface AttendanceGridProps {
  students: Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
  }>;
  lessons: Lesson[];
  initialAttendance?: Record<string, Record<string, AttendanceCell>>; // lessonId -> studentId -> cell
  onCellChange?: (studentId: string, lessonId: string, status: AttendanceStatus) => void;
  onLessonSave?: (lessonId: string, attendances: Array<{ studentId: string; isPresent: boolean; absenceType?: AbsenceType }>) => Promise<void>;
  isLoading?: boolean;
  isSaving?: Record<string, boolean>; // lessonId -> isSaving
  dateRange?: { from: string; to: string };
  onSaveSuccess?: (lessonId: string) => void;
  onSaveError?: (lessonId: string, error: string) => void;
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
}

export function AttendanceGrid({
  students,
  lessons,
  initialAttendance = {},
  onCellChange,
  onLessonSave,
  isLoading = false,
  isSaving = {},
  dateRange,
  onSaveSuccess,
  onSaveError,
  onUnsavedChangesChange,
}: AttendanceGridProps) {
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, AttendanceCell>>>(
    initialAttendance
  );
  const [focusedCell, setFocusedCell] = useState<{ studentId: string; lessonId: string } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Set<string>>>({}); // lessonId -> Set of studentIds
  const [saveError, setSaveError] = useState<Record<string, string>>({}); // lessonId -> error message
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({}); // lessonId -> success
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Record<string, HTMLTableCellElement>>({});
  const initialDataRef = useRef<Record<string, Record<string, AttendanceCell>>>(initialAttendance);

  // Initialize attendance data
  useEffect(() => {
    if (Object.keys(initialAttendance).length > 0) {
      setAttendanceData(initialAttendance);
      initialDataRef.current = initialAttendance;
      // Clear pending changes when initial data changes (e.g., after save or data refresh)
      setPendingChanges({});
      setSaveError({});
      setSaveSuccess({});
    }
  }, [initialAttendance]);

  // Track unsaved changes for navigation warning
  const hasUnsavedChanges = useMemo(() => {
    return Object.values(pendingChanges).some((set) => set.size > 0);
  }, [pendingChanges]);

  // Notify parent component about unsaved changes state
  useEffect(() => {
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Get cell status
  const getCellStatus = useCallback(
    (studentId: string, lessonId: string): AttendanceStatus => {
      const cell = attendanceData[lessonId]?.[studentId];
      if (!cell) return 'not_marked';
      return cell.status;
    },
    [attendanceData]
  );

  // Toggle cell status - simplified cycle: Not Marked → Present → Absent (Justified) → Absent (Unjustified) → Not Marked
  const toggleCellStatus = useCallback(
    (studentId: string, lessonId: string) => {
      const currentStatus = getCellStatus(studentId, lessonId);
      const statuses: AttendanceStatus[] = ['not_marked', 'present', 'absent_justified', 'absent_unjustified'];
      const currentIndex = statuses.indexOf(currentStatus);
      const nextIndex = (currentIndex + 1) % statuses.length;
      const newStatus = statuses[nextIndex];

      setAttendanceData((prev) => {
        const lessonData = prev[lessonId] || {};
        return {
          ...prev,
          [lessonId]: {
            ...lessonData,
            [studentId]: {
              studentId,
              lessonId,
              status: newStatus,
              isPresent: newStatus === 'present',
              absenceType: newStatus === 'absent_justified' ? 'JUSTIFIED' : newStatus === 'absent_unjustified' ? 'UNJUSTIFIED' : undefined,
            },
          },
        };
      });

      // Add to pending changes for this lesson
      setPendingChanges((prev) => {
        const lessonChanges = prev[lessonId] || new Set();
        return {
          ...prev,
          [lessonId]: new Set(lessonChanges).add(studentId),
        };
      });

      // Clear success/error state for this lesson when new changes are made
      setSaveSuccess((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
      setSaveError((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });

      if (onCellChange) {
        onCellChange(studentId, lessonId, newStatus);
      }
    },
    [getCellStatus, onCellChange]
  );

  // Handle manual save for a specific lesson
  const handleManualSave = useCallback(
    async (lessonId: string) => {
      if (!onLessonSave || !pendingChanges[lessonId] || pendingChanges[lessonId].size === 0) return;

      const attendances: Array<{ studentId: string; isPresent: boolean; absenceType?: AbsenceType }> = [];

      pendingChanges[lessonId].forEach((studentId) => {
        const cell = attendanceData[lessonId]?.[studentId];
        if (cell) {
          attendances.push({
            studentId,
            isPresent: cell.isPresent,
            absenceType: cell.absenceType,
          });
        }
      });

      if (attendances.length > 0) {
        try {
          // Clear previous errors
          setSaveError((prev) => {
            const next = { ...prev };
            delete next[lessonId];
            return next;
          });
          setSaveSuccess((prev) => {
            const next = { ...prev };
            delete next[lessonId];
            return next;
          });

          await onLessonSave(lessonId, attendances);

          // Mark as saved
          setPendingChanges((prev) => {
            const next = { ...prev };
            delete next[lessonId];
            return next;
          });
          setSaveSuccess((prev) => ({ ...prev, [lessonId]: true }));

          // Call success callback
          if (onSaveSuccess) {
            onSaveSuccess(lessonId);
          }

          // Clear success message after 3 seconds
          setTimeout(() => {
            setSaveSuccess((prev) => {
              const next = { ...prev };
              delete next[lessonId];
              return next;
            });
          }, 3000);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to save attendance';
          setSaveError((prev) => ({
            ...prev,
            [lessonId]: errorMessage,
          }));

          // Call error callback
          if (onSaveError) {
            onSaveError(lessonId, errorMessage);
          }

          console.error('Save failed:', error);
        }
      }
    },
    [onLessonSave, pendingChanges, attendanceData, onSaveSuccess, onSaveError]
  );

  // Handle save all lessons with pending changes
  const handleSaveAll = useCallback(async () => {
    const lessonsWithChanges = Object.keys(pendingChanges).filter(
      (lessonId) => pendingChanges[lessonId] && pendingChanges[lessonId].size > 0
    );

    for (const lessonId of lessonsWithChanges) {
      await handleManualSave(lessonId);
    }
  }, [pendingChanges, handleManualSave]);

  // Scroll to focused cell
  useEffect(() => {
    if (focusedCell) {
      const cellKey = `${focusedCell.studentId}-${focusedCell.lessonId}`;
      const cellElement = cellRefs.current[cellKey];
      if (cellElement && gridRef.current) {
        cellElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        cellElement.focus();
      }
    }
  }, [focusedCell]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, studentId: string, lessonId: string) => {
      if (isLoading || isSaving) return;

      const studentIndex = students.findIndex((s) => s.id === studentId);
      const filteredLessonsList = dateRange
        ? lessons.filter((l) => {
            const lessonDate = new Date(l.scheduledAt).toISOString().split('T')[0];
            return lessonDate >= dateRange.from && lessonDate <= dateRange.to;
          })
        : lessons;
      const lessonIndex = filteredLessonsList.findIndex((l) => l.id === lessonId);

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          toggleCellStatus(studentId, lessonId);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (studentIndex > 0) {
            const prevStudent = students[studentIndex - 1];
            setFocusedCell({ studentId: prevStudent.id, lessonId });
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (studentIndex < students.length - 1) {
            const nextStudent = students[studentIndex + 1];
            setFocusedCell({ studentId: nextStudent.id, lessonId });
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (lessonIndex > 0) {
            const prevLesson = filteredLessonsList[lessonIndex - 1];
            setFocusedCell({ studentId, lessonId: prevLesson.id });
          }
          break;
        case 'ArrowRight':
        case 'Tab':
          e.preventDefault();
          if (lessonIndex < filteredLessonsList.length - 1) {
            const nextLesson = filteredLessonsList[lessonIndex + 1];
            setFocusedCell({ studentId, lessonId: nextLesson.id });
          }
          break;
      }
    },
    [students, lessons, toggleCellStatus, isLoading, isSaving, dateRange]
  );

  // Filter lessons by date range if provided
  const filteredLessons = useMemo(() => {
    if (!dateRange) return lessons;
    return lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
      return lessonDate >= dateRange.from && lessonDate <= dateRange.to;
    });
  }, [lessons, dateRange]);

  // Group lessons by date and sort chronologically (oldest to newest)
  const lessonsByDate = useMemo(() => {
    const grouped: Record<string, Lesson[]> = {};
    filteredLessons.forEach((lesson) => {
      const date = new Date(lesson.scheduledAt).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(lesson);
    });
    
    // Sort lessons within each date by time
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
    });
    
    // Return sorted entries (oldest to newest)
    const sortedEntries = Object.entries(grouped).sort(([dateA], [dateB]) => 
      dateA.localeCompare(dateB)
    );
    
    return Object.fromEntries(sortedEntries);
  }, [filteredLessons]);

  // Get status styles - enhanced for better visibility and contrast
  const getStatusStyles = (status: AttendanceStatus) => {
    const styles = {
      present: 'bg-green-100 hover:bg-green-200 border-2 border-green-400 text-green-800 font-semibold',
      absent_justified: 'bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 text-amber-800 font-semibold',
      absent_unjustified: 'bg-red-100 hover:bg-red-200 border-2 border-red-400 text-red-800 font-semibold',
      not_marked: 'bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-600',
    };
    return styles[status];
  };

  // Get status icon
  const getStatusIcon = (status: AttendanceStatus) => {
    const icons = {
      present: '✓',
      absent_justified: 'J',
      absent_unjustified: '✗',
      not_marked: '',
    };
    return icons[status];
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-500">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  const totalPendingChanges = Object.values(pendingChanges).reduce((sum, set) => sum + set.size, 0);
  const hasAnySaving = isSaving && Object.values(isSaving).some((saving) => saving);
  const lessonsWithChanges = Object.keys(pendingChanges).filter(
    (lessonId) => pendingChanges[lessonId] && pendingChanges[lessonId].size > 0
  );

  return (
    <div className="space-y-4">
      {/* Prominent Save button and status indicator */}
      <div className={cn(
        "flex items-center justify-between rounded-lg px-5 py-4 text-sm border-2 transition-all",
        totalPendingChanges > 0 
          ? "bg-amber-50 border-amber-300" 
          : hasAnySaving
          ? "bg-blue-50 border-blue-300"
          : Object.keys(saveSuccess).length > 0
          ? "bg-green-50 border-green-300"
          : "bg-slate-50 border-slate-200"
      )}>
        <div className="flex items-center gap-4 flex-1">
          {hasAnySaving ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent"></div>
              <span className="text-blue-800 font-semibold text-base">Saving changes...</span>
            </>
          ) : totalPendingChanges > 0 ? (
            <>
              <div className="h-4 w-4 rounded-full bg-amber-500 animate-pulse"></div>
              <div>
                <span className="text-amber-800 font-bold text-base block">
                  {totalPendingChanges} unsaved {totalPendingChanges === 1 ? 'change' : 'changes'}
                </span>
                <span className="text-amber-700 text-xs mt-0.5 block">Click "Save All" to save your changes</span>
              </div>
            </>
          ) : Object.keys(saveSuccess).length > 0 ? (
            <>
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800 font-semibold text-base">All changes saved successfully</span>
            </>
          ) : (
            <span className="text-slate-600 text-sm">No unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {Object.keys(saveError).length > 0 && (
            <span className="text-red-700 text-sm font-medium px-3 py-1 bg-red-100 rounded">
              {Object.values(saveError)[0]} {Object.keys(saveError).length > 1 && `(+${Object.keys(saveError).length - 1} more)`}
            </span>
          )}
          {totalPendingChanges > 0 && !hasAnySaving && (
            <Button
              onClick={handleSaveAll}
              disabled={lessonsWithChanges.length === 0 || hasAnySaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 text-base shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              Save All Changes
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="overflow-auto rounded-lg border-2 border-slate-300 bg-white shadow-sm"
        style={{ maxHeight: 'calc(100vh - 400px)' }}
      >
        <div className="inline-block min-w-full">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
              <tr>
                {/* Student name column (frozen) */}
                <th className="sticky left-0 z-30 bg-slate-100 border-b-2 border-r-2 border-slate-400 px-4 md:px-5 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wide min-w-[180px] md:min-w-[220px] shadow-sm">
                  <div className="flex items-center gap-2">
                    <span>Student</span>
                  </div>
                </th>
                {/* Date/Lesson columns */}
                {Object.entries(lessonsByDate).map(([date, dateLessons]) => (
                  <th
                    key={date}
                    colSpan={dateLessons.length}
                    className="border-b-2 border-r-2 border-slate-400 px-2 md:px-3 py-3 text-center bg-slate-200"
                  >
                    <div className="font-bold text-xs md:text-sm text-slate-900">{formatDate(date)}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {dateLessons.length} {dateLessons.length === 1 ? 'session' : 'sessions'}
                    </div>
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50 sticky z-20" style={{ top: '64px' }}>
                <th className="sticky left-0 z-30 bg-slate-50 border-b-2 border-r-2 border-slate-400 shadow-sm"></th>
                {Object.entries(lessonsByDate).map(([date, dateLessons]) =>
                  dateLessons.map((lesson) => (
                    <th
                      key={lesson.id}
                      className="border-b-2 border-r-2 border-slate-400 px-2 md:px-3 py-3 text-center bg-slate-50 min-w-[90px] md:min-w-[110px]"
                    >
                      <div className="font-semibold text-xs md:text-sm text-slate-800 mb-1">{formatTime(lesson.scheduledAt)}</div>
                      {lesson.topic && (
                        <div className="text-[10px] md:text-[11px] text-slate-600 truncate max-w-[90px] md:max-w-[110px] font-medium" title={lesson.topic}>
                          {lesson.topic}
                        </div>
                      )}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y-2 divide-slate-200">
              {students.map((student) => {
                const initials = `${student.user.firstName[0] || ''}${student.user.lastName[0] || ''}` || '?';
                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    {/* Student name cell (frozen) */}
                    <td className="sticky left-0 z-20 bg-white border-r-2 border-b-2 border-slate-400 px-4 md:px-5 py-4 whitespace-nowrap shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm md:text-base font-semibold text-slate-900 truncate max-w-[120px] md:max-w-none">
                            {student.user.firstName} {student.user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Attendance cells */}
                {Object.entries(lessonsByDate).map(([date, dateLessons]) =>
                  dateLessons.map((lesson) => {
                    const status = getCellStatus(student.id, lesson.id);
                    const isFocused = focusedCell?.studentId === student.id && focusedCell?.lessonId === lesson.id;
                    const hasPendingChange = pendingChanges[lesson.id]?.has(student.id) || false;
                    const isLessonSaving = isSaving?.[lesson.id] || false;
                    const hasLessonChanges = pendingChanges[lesson.id] && pendingChanges[lesson.id].size > 0;

                    const cellKey = `${student.id}-${lesson.id}`;
                    return (
                      <td
                        key={lesson.id}
                        ref={(el) => {
                          if (el) cellRefs.current[cellKey] = el;
                        }}
                        className={cn(
                          'border-r-2 border-b-2 border-slate-300 px-2 md:px-3 py-3 text-center cursor-pointer transition-all relative min-h-[60px]',
                          getStatusStyles(status),
                          isFocused && 'ring-4 ring-blue-500 ring-offset-2 shadow-lg',
                          hasPendingChange && 'ring-2 ring-amber-500',
                          isLessonSaving && 'opacity-60 cursor-wait'
                        )}
                        onClick={() => !isLessonSaving && toggleCellStatus(student.id, lesson.id)}
                        onKeyDown={(e) => !isLessonSaving && handleKeyDown(e, student.id, lesson.id)}
                        tabIndex={isLessonSaving ? -1 : 0}
                        role="gridcell"
                        aria-label={`${student.user.firstName} ${student.user.lastName} - ${formatDate(lesson.scheduledAt)} ${formatTime(lesson.scheduledAt)} - ${status === 'present' ? 'Present' : status === 'absent_justified' ? 'Absent Justified' : status === 'absent_unjustified' ? 'Absent Unjustified' : 'Not Marked'}`}
                        aria-disabled={isLessonSaving}
                        title={`Click to mark: ${status === 'not_marked' ? 'Present' : status === 'present' ? 'Absent (Justified)' : status === 'absent_justified' ? 'Absent (Unjustified)' : 'Not Marked'}`}
                      >
                        <div className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 mx-auto rounded-md text-base md:text-lg font-bold relative">
                          {getStatusIcon(status)}
                          {isLessonSaving && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md">
                              <div className="h-4 w-4 animate-spin rounded-full border-[3px] border-current border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                        {hasPendingChange && !isLessonSaving && (
                          <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm animate-pulse"></div>
                        )}
                      </td>
                    );
                  })
                )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Enhanced Legend */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm bg-slate-100 rounded-lg px-5 py-4 border-2 border-slate-300">
        <span className="font-bold text-slate-900 text-base">Legend:</span>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-green-100 border-2 border-green-400 rounded-md text-green-800 flex items-center justify-center text-sm font-bold shadow-sm">
            ✓
          </span>
          <span className="font-semibold text-slate-800">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-amber-100 border-2 border-amber-400 rounded-md text-amber-800 flex items-center justify-center text-sm font-bold shadow-sm">
            J
          </span>
          <span className="font-semibold text-slate-800">Absent (Justified)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-red-100 border-2 border-red-400 rounded-md text-red-800 flex items-center justify-center text-sm font-bold shadow-sm">
            ✗
          </span>
          <span className="font-semibold text-slate-800">Absent (Unjustified)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-white border-2 border-slate-300 rounded-md shadow-sm"></span>
          <span className="font-semibold text-slate-800">Not Marked</span>
        </div>
        <div className="ml-auto text-slate-600 text-xs md:text-sm hidden md:block">
          <span className="font-medium">Tip:</span> Click any cell to mark attendance • Use arrow keys to navigate
        </div>
      </div>
    </div>
  );
}

