'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import type { Lesson } from '@/features/lessons';
import type { AbsenceType } from '@/features/attendance';
import { formatDateString, formatDateDisplay, isToday } from '@/features/attendance/utils/dateUtils';

type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified' | 'not_marked';

interface AttendanceCell {
  studentId: string;
  lessonId: string;
  status: AttendanceStatus;
  isPresent: boolean;
  absenceType?: AbsenceType;
}

interface WeekAttendanceGridProps {
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
  onDaySave?: (date: string, attendances: Array<{ studentId: string; lessonId: string; isPresent: boolean; absenceType?: AbsenceType }>) => Promise<void>;
  isLoading?: boolean;
  isSaving?: Record<string, boolean>; // date -> isSaving
  weekDates: Date[]; // Array of 7 dates (Mon-Sun)
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
  onSaveSuccess?: (date: string) => void;
  onSaveError?: (date: string, error: string) => void;
}

export function WeekAttendanceGrid({
  students,
  lessons,
  initialAttendance = {},
  onDaySave,
  isLoading = false,
  isSaving = {},
  weekDates,
  onUnsavedChangesChange,
  onSaveSuccess,
  onSaveError,
}: WeekAttendanceGridProps) {
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, AttendanceCell>>>(
    initialAttendance
  );
  const [pendingChanges, setPendingChanges] = useState<Record<string, Set<string>>>({}); // date -> Set of studentIds
  const [saveError, setSaveError] = useState<Record<string, string>>({}); // date -> error message
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({}); // date -> success
  const gridRef = useRef<HTMLDivElement>(null);
  const initialDataRef = useRef<Record<string, Record<string, AttendanceCell>>>(initialAttendance);
  const prevInitialAttendanceRef = useRef<Record<string, Record<string, AttendanceCell>>>(initialAttendance);
  const isInitialMountRef = useRef(true);
  const pendingChangesRef = useRef<Record<string, Set<string>>>({});

  // Keep ref in sync with state
  useEffect(() => {
    pendingChangesRef.current = pendingChanges;
  }, [pendingChanges]);

  // Initialize attendance data on mount
  useEffect(() => {
    if (isInitialMountRef.current && Object.keys(initialAttendance).length > 0) {
      setAttendanceData(initialAttendance);
      initialDataRef.current = initialAttendance;
      prevInitialAttendanceRef.current = initialAttendance;
      isInitialMountRef.current = false;
    }
  }, []);

  // Sync from initialAttendance only when there are no pending changes
  useEffect(() => {
    if (isInitialMountRef.current) return;
    
    if (Object.keys(initialAttendance).length > 0) {
      const hasAnyPendingChanges = Object.values(pendingChangesRef.current).some((set) => set.size > 0);
      
      // Check if this is a structural change (e.g., different lessons/students - group or date range changed)
      const prevInitial = prevInitialAttendanceRef.current;
      const currentLessonIds = Object.keys(initialAttendance).sort();
      const prevLessonIds = Object.keys(prevInitial).sort();
      const hasStructuralChange = 
        currentLessonIds.length !== prevLessonIds.length ||
        currentLessonIds.some((id, idx) => id !== prevLessonIds[idx]);

      if (!hasAnyPendingChanges) {
        setAttendanceData(initialAttendance);
        initialDataRef.current = initialAttendance;
        prevInitialAttendanceRef.current = initialAttendance;
      } else if (hasStructuralChange) {
        setAttendanceData(initialAttendance);
        initialDataRef.current = initialAttendance;
        prevInitialAttendanceRef.current = initialAttendance;
        setPendingChanges({});
        setSaveError({});
        setSaveSuccess({});
      } else {
        // Merge: keep local changes for cells with pending changes, update others from initialAttendance
        setAttendanceData((prev) => {
          const merged: Record<string, Record<string, AttendanceCell>> = {};
          
          Object.keys(initialAttendance).forEach((lessonId) => {
            merged[lessonId] = { ...initialAttendance[lessonId] };
          });
          
          Object.keys(pendingChangesRef.current).forEach((date) => {
            const datePendingChanges = pendingChangesRef.current[date];
            if (datePendingChanges && datePendingChanges.size > 0) {
              // Find all lessons for this date
              const dateStr = date;
              const lessonsForDate = lessons.filter((lesson) => {
                const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
                return lessonDate === dateStr;
              });
              
              lessonsForDate.forEach((lesson) => {
                if (!merged[lesson.id]) {
                  merged[lesson.id] = {};
                }
                datePendingChanges.forEach((studentId) => {
                  if (prev[lesson.id]?.[studentId]) {
                    merged[lesson.id][studentId] = prev[lesson.id][studentId];
                  }
                });
              });
            }
          });
          
          return merged;
        });
        prevInitialAttendanceRef.current = initialAttendance;
      }
    }
  }, [initialAttendance, lessons]);

  // Track unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return Object.values(pendingChanges).some((set) => set.size > 0);
  }, [pendingChanges]);

  // Notify parent component about unsaved changes state
  useEffect(() => {
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  // Group lessons by date
  const lessonsByDate = useMemo(() => {
    const grouped: Record<string, Lesson[]> = {};
    weekDates.forEach((date) => {
      const dateStr = formatDateString(date);
      grouped[dateStr] = lessons.filter((lesson) => {
        const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
        return lessonDate === dateStr;
      });
    });
    return grouped;
  }, [lessons, weekDates]);

  // Get attendance status for a student on a specific date
  // If multiple lessons exist, use the first lesson's attendance
  const getCellStatus = useCallback(
    (studentId: string, date: Date): { status: AttendanceStatus; lessonId: string | null } => {
      const dateStr = formatDateString(date);
      const dayLessons = lessonsByDate[dateStr] || [];
      
      if (dayLessons.length === 0) {
        return { status: 'not_marked', lessonId: null };
      }

      // Use the first lesson of the day
      const firstLesson = dayLessons[0];
      const cell = attendanceData[firstLesson.id]?.[studentId];
      
      if (!cell) {
        return { status: 'not_marked', lessonId: firstLesson.id };
      }
      
      return { status: cell.status, lessonId: firstLesson.id };
    },
    [attendanceData, lessonsByDate]
  );

  // Toggle cell status
  const toggleCellStatus = useCallback(
    (studentId: string, date: Date) => {
      const dateStr = formatDateString(date);
      const dayLessons = lessonsByDate[dateStr] || [];
      
      if (dayLessons.length === 0) {
        return; // No lessons on this day
      }

      const currentStatus = getCellStatus(studentId, date);
      const statuses: AttendanceStatus[] = ['not_marked', 'present', 'absent_justified', 'absent_unjustified'];
      const currentIndex = statuses.indexOf(currentStatus.status);
      const nextIndex = (currentIndex + 1) % statuses.length;
      const newStatus = statuses[nextIndex];

      // Update attendance for all lessons on this day
      setAttendanceData((prev) => {
        const updated = { ...prev };
        
        dayLessons.forEach((lesson) => {
          if (!updated[lesson.id]) {
            updated[lesson.id] = {};
          }
          updated[lesson.id] = {
            ...updated[lesson.id],
            [studentId]: {
              studentId,
              lessonId: lesson.id,
              status: newStatus,
              isPresent: newStatus === 'present',
              absenceType: newStatus === 'absent_justified' ? 'JUSTIFIED' : newStatus === 'absent_unjustified' ? 'UNJUSTIFIED' : undefined,
            },
          };
        });
        
        return updated;
      });

      // Add to pending changes for this date
      setPendingChanges((prev) => {
        const dateChanges = prev[dateStr] || new Set();
        return {
          ...prev,
          [dateStr]: new Set(dateChanges).add(studentId),
        };
      });

      // Clear success/error state for this date
      setSaveSuccess((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
      setSaveError((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
    },
    [getCellStatus, lessonsByDate]
  );

  // Handle manual save for a specific date
  const handleDaySave = useCallback(
    async (date: Date) => {
      if (!onDaySave) return;
      
      const dateStr = formatDateString(date);
      if (!pendingChanges[dateStr] || pendingChanges[dateStr].size === 0) return;

      const dayLessons = lessonsByDate[dateStr] || [];
      if (dayLessons.length === 0) return;

      const attendances: Array<{ studentId: string; lessonId: string; isPresent: boolean; absenceType?: AbsenceType }> = [];

      pendingChanges[dateStr].forEach((studentId) => {
        // Get status from first lesson (they should all be the same since we update all together)
        const firstLesson = dayLessons[0];
        const cell = attendanceData[firstLesson.id]?.[studentId];
        
        if (cell) {
          // Apply to all lessons on this day
          dayLessons.forEach((lesson) => {
            attendances.push({
              studentId,
              lessonId: lesson.id,
              isPresent: cell.isPresent,
              absenceType: cell.absenceType,
            });
          });
        }
      });

      if (attendances.length > 0) {
        try {
          setSaveError((prev) => {
            const next = { ...prev };
            delete next[dateStr];
            return next;
          });
          setSaveSuccess((prev) => {
            const next = { ...prev };
            delete next[dateStr];
            return next;
          });

          await onDaySave(dateStr, attendances);

          setPendingChanges((prev) => {
            const next = { ...prev };
            delete next[dateStr];
            return next;
          });
          setSaveSuccess((prev) => ({ ...prev, [dateStr]: true }));

          if (onSaveSuccess) {
            onSaveSuccess(dateStr);
          }

          setTimeout(() => {
            setSaveSuccess((prev) => {
              const next = { ...prev };
              delete next[dateStr];
              return next;
            });
          }, 3000);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to save attendance';
          setSaveError((prev) => ({
            ...prev,
            [dateStr]: errorMessage,
          }));

          if (onSaveError) {
            onSaveError(dateStr, errorMessage);
          }
        }
      }
    },
    [onDaySave, pendingChanges, attendanceData, lessonsByDate, onSaveSuccess, onSaveError]
  );

  // Handle save all dates with pending changes
  const handleSaveAll = useCallback(async () => {
    const datesWithChanges = Object.keys(pendingChanges).filter(
      (dateStr) => pendingChanges[dateStr] && pendingChanges[dateStr].size > 0
    );

    for (const dateStr of datesWithChanges) {
      const date = weekDates.find((d) => formatDateString(d) === dateStr);
      if (date) {
        await handleDaySave(date);
      }
    }
  }, [pendingChanges, handleDaySave, weekDates]);

  // Get status styles
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

  // Format day header
  const formatDayHeader = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return { dayName, dayNum, month };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-500">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  const totalPendingChanges = Object.values(pendingChanges).reduce((sum, set) => sum + set.size, 0);
  const hasAnySaving = isSaving && Object.values(isSaving).some((saving) => saving);
  const datesWithChanges = Object.keys(pendingChanges).filter(
    (dateStr) => pendingChanges[dateStr] && pendingChanges[dateStr].size > 0
  );

  return (
    <div className="space-y-4">
      {/* Save button and status indicator */}
      <div className={cn(
        "flex items-center justify-between rounded-lg px-5 py-4 text-sm border-2 transition-all",
        totalPendingChanges > 0 
          ? "bg-amber-50 border-amber-300" 
          : hasAnySaving
          ? "bg-primary/10 border-primary/30"
          : Object.keys(saveSuccess).length > 0
          ? "bg-green-50 border-green-300"
          : "bg-slate-50 border-slate-200"
      )}>
        <div className="flex items-center gap-4 flex-1">
          {hasAnySaving ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent"></div>
              <span className="text-primary font-semibold text-base">Saving changes...</span>
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
              disabled={datesWithChanges.length === 0 || hasAnySaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 text-base shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              Save All Changes
            </Button>
          )}
        </div>
      </div>

      {/* Grid - Fixed height container */}
      <div
        ref={gridRef}
        className="rounded-lg border-2 border-slate-300 bg-white shadow-sm overflow-hidden flex flex-col"
        style={{ height: 'calc(100vh - 500px)', minHeight: '400px', maxHeight: '600px' }}
      >
        <div className="flex-1 overflow-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
              <tr>
                {/* Student name column (frozen) */}
                <th className="sticky left-0 z-30 bg-slate-100 border-b-2 border-r-2 border-slate-400 px-4 md:px-5 py-3 text-left text-sm font-bold text-slate-900 uppercase tracking-wide min-w-[180px] md:min-w-[220px] shadow-sm">
                  <div className="flex items-center gap-2">
                    <span>Student</span>
                  </div>
                </th>
                {/* Day columns (Mon-Sun) */}
                {weekDates.map((date) => {
                  const { dayName, dayNum, month } = formatDayHeader(date);
                  const dateStr = formatDateString(date);
                  const dayLessons = lessonsByDate[dateStr] || [];
                  const isTodayDate = isToday(date);
                  const hasLessons = dayLessons.length > 0;
                  const isDateSaving = isSaving[dateStr] || false;
                  const hasDateChanges = pendingChanges[dateStr] && pendingChanges[dateStr].size > 0;
                  
                  return (
                    <th
                      key={dateStr}
                      className="border-b-2 border-r-2 border-slate-400 px-2 md:px-3 py-3 text-center bg-slate-100 min-w-[100px] md:min-w-[120px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className={cn(
                          "font-semibold text-xs md:text-sm",
                          isTodayDate ? "text-primary" : "text-slate-800"
                        )}>
                          {dayName}
                        </div>
                        <div className={cn(
                          "text-lg md:text-xl font-bold",
                          isTodayDate ? "text-primary" : "text-slate-900"
                        )}>
                          {dayNum}
                        </div>
                        <div className="text-[10px] md:text-[11px] text-slate-600 font-medium">
                          {month}
                        </div>
                        {hasLessons && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            {dayLessons.length} {dayLessons.length === 1 ? 'session' : 'sessions'}
                          </div>
                        )}
                        {!hasLessons && (
                          <div className="text-[10px] text-slate-400 mt-1 italic">
                            No sessions
                          </div>
                        )}
                        {hasDateChanges && !isDateSaving && (
                          <div className="mt-1">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDaySave(date);
                              }}
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              disabled={isDateSaving}
                            >
                              Save
                            </Button>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
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
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm md:text-base font-semibold text-slate-900 truncate max-w-[120px] md:max-w-none">
                            {student.user.firstName} {student.user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Attendance cells for each day */}
                    {weekDates.map((date) => {
                      const dateStr = formatDateString(date);
                      const dayLessons = lessonsByDate[dateStr] || [];
                      const { status, lessonId: _lessonId } = getCellStatus(student.id, date);
                      const hasPendingChange = pendingChanges[dateStr]?.has(student.id) || false;
                      const isDateSaving = isSaving[dateStr] || false;
                      const hasLessons = dayLessons.length > 0;

                      return (
                        <td
                          key={dateStr}
                          className={cn(
                            'border-r-2 border-b-2 border-slate-300 px-2 md:px-3 py-3 text-center cursor-pointer transition-all relative min-h-[60px]',
                            getStatusStyles(status),
                            hasPendingChange && 'ring-2 ring-amber-500',
                            isDateSaving && 'opacity-60 cursor-wait',
                            !hasLessons && 'cursor-not-allowed opacity-50'
                          )}
                          onClick={() => hasLessons && !isDateSaving && toggleCellStatus(student.id, date)}
                          tabIndex={hasLessons && !isDateSaving ? 0 : -1}
                          role="gridcell"
                          aria-label={`${student.user.firstName} ${student.user.lastName} - ${formatDateDisplay(date)} - ${status === 'present' ? 'Present' : status === 'absent_justified' ? 'Absent Justified' : status === 'absent_unjustified' ? 'Absent Unjustified' : 'Not Marked'}`}
                          aria-disabled={!hasLessons || isDateSaving}
                          title={hasLessons ? `Click to mark: ${status === 'not_marked' ? 'Present' : status === 'present' ? 'Absent (Justified)' : status === 'absent_justified' ? 'Absent (Unjustified)' : 'Not Marked'}` : 'No sessions scheduled'}
                        >
                          {hasLessons ? (
                            <>
                              <div className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 mx-auto rounded-md text-base md:text-lg font-bold relative">
                                {getStatusIcon(status)}
                                {isDateSaving && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md">
                                    <div className="h-4 w-4 animate-spin rounded-full border-[3px] border-current border-t-transparent"></div>
                                  </div>
                                )}
                              </div>
                              {hasPendingChange && !isDateSaving && (
                                <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm animate-pulse"></div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 mx-auto text-slate-400 text-xs">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
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
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-white border-2 border-slate-300 rounded-md text-slate-400 flex items-center justify-center text-xs">—</span>
          <span className="font-semibold text-slate-800">No Session</span>
        </div>
        <div className="ml-auto text-slate-600 text-xs md:text-sm hidden md:block">
          <span className="font-medium">Tip:</span> Click any cell to mark attendance
        </div>
      </div>
    </div>
  );
}








