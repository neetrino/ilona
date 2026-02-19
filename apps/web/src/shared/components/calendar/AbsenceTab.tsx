'use client';

import { useState, useEffect } from 'react';
import { useLessonAttendance, useMarkBulkAttendance } from '@/features/attendance';
import { useLesson } from '@/features/lessons';
import { Button } from '@/shared/components/ui/button';
import { markAbsenceComplete } from '@/features/lessons/api/obligations.api';
import { useQueryClient } from '@tanstack/react-query';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';
import type { AbsenceType } from '@/features/attendance';

interface AbsenceTabProps {
  lessonId: string;
}

type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified' | 'not_marked';

export function AbsenceTab({ lessonId }: AbsenceTabProps) {
  const queryClient = useQueryClient();
  const { data: lesson } = useLesson(lessonId);
  const { data: attendanceData, isLoading } = useLessonAttendance(lessonId);
  const markBulkAttendance = useMarkBulkAttendance();
  const [attendance, setAttendance] = useState<Record<string, { isPresent: boolean; absenceType?: AbsenceType }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Declare students before useEffect that uses it
  // Get students from attendanceData instead of lesson.group (which doesn't have students in the type)
  const students = attendanceData?.studentsWithAttendance?.map(swa => swa.student) || [];

  // Initialize attendance state from saved data - only prefill students with saved attendance
  useEffect(() => {
    if (attendanceData?.studentsWithAttendance && attendanceData.studentsWithAttendance.length > 0) {
      const initial: Record<string, { isPresent: boolean; absenceType?: AbsenceType }> = {};
      
      // Initialize only students with saved attendance (do not default to present)
      attendanceData.studentsWithAttendance.forEach((swa) => {
        const savedAttendance = swa.attendance;
        
        if (savedAttendance) {
          // Use saved attendance - only set state for students with saved data
          initial[swa.student.id] = {
            isPresent: savedAttendance.isPresent,
            absenceType: savedAttendance.absenceType || undefined,
          };
        }
        // If no saved attendance, don't set any value - student will show as 'not_marked'
      });
      
      setAttendance(initial);
      // Reset hasChanges since we're loading saved data
      setHasChanges(false);
    }
  }, [attendanceData]);

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setHasChanges(true);
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        isPresent: status === 'present',
        absenceType: status === 'absent_justified' ? 'JUSTIFIED' : status === 'absent_unjustified' ? 'UNJUSTIFIED' : undefined,
      },
    }));
  };

  const handleSave = async () => {
    if (!lesson) return;

    // Only save students that have been explicitly marked (filter out unmarked students)
    const attendances = students
      .filter((student) => attendance[student.id] !== undefined)
      .map((student) => {
        const att = attendance[student.id];
        if (!att) return null;
        return {
          studentId: student.id,
          isPresent: att.isPresent,
          absenceType: att.absenceType,
        };
      })
      .filter((att): att is NonNullable<typeof att> => att !== null);

    try {
      await markBulkAttendance.mutateAsync({
        lessonId: lesson.id,
        attendances,
      });

      // Mark absence as complete
      await markAbsenceComplete(lesson.id);
      
      // Invalidate both detail and list queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(lesson.id) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      // Invalidate salary queries to reflect immediate salary updates
      queryClient.invalidateQueries({ queryKey: ['finance', 'salaries'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'salaries', 'breakdown'] });

      setHasChanges(false);
      alert('Attendance saved successfully!');
    } catch (err: unknown) {
      console.error('Failed to save attendance:', err);
      alert('Failed to save attendance. Please try again.');
    }
  };

  const getStatus = (studentId: string): AttendanceStatus => {
    const att = attendance[studentId];
    if (!att) {
      // Fallback to saved data if state not initialized yet
      const studentWithAttendance = attendanceData?.studentsWithAttendance?.find(
        (swa) => swa.student.id === studentId
      );
      const existing = studentWithAttendance?.attendance;
      if (existing) {
        return existing.isPresent
          ? 'present'
          : existing.absenceType === 'JUSTIFIED'
          ? 'absent_justified'
          : 'absent_unjustified';
      }
      return 'not_marked';
    }
    // Use current state (which includes saved data)
    return att.isPresent
      ? 'present'
      : att.absenceType === 'JUSTIFIED'
      ? 'absent_justified'
      : 'absent_unjustified';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-sm text-slate-500">Loading attendance data...</p>
      </div>
    );
  }

  if (attendanceData && students.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>No students in this lesson's group</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Edit Attendance</h3>
          <p className="text-sm text-slate-500 mt-1">
            {attendanceData?.summary && attendanceData.summary.notMarked < attendanceData.summary.total
              ? 'Update attendance marks for students in this lesson'
              : 'Mark attendance for all students in this lesson'}
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={markBulkAttendance.isPending || students.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {markBulkAttendance.isPending ? 'Saving...' : hasChanges ? 'Save Changes' : 'Save Attendance'}
        </Button>
      </div>

      <div className="space-y-2">
        {students.map((student) => {
          const status = getStatus(student.id);
          return (
            <div
              key={student.id}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                  {student.user.firstName[0]}{student.user.lastName[0]}
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {student.user.firstName} {student.user.lastName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAttendanceChange(student.id, 'present')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    status === 'present'
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => handleAttendanceChange(student.id, 'absent_justified')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    status === 'absent_justified'
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                      : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                  }`}
                >
                  Justified
                </button>
                <button
                  onClick={() => handleAttendanceChange(student.id, 'absent_unjustified')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    status === 'absent_unjustified'
                      ? 'bg-red-100 text-red-700 border-2 border-red-500'
                      : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                  }`}
                >
                  Unjustified
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="text-center p-12 text-slate-500">
          No students in this lesson's group
        </div>
      )}
    </div>
  );
}

