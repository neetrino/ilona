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

  useEffect(() => {
    if (attendanceData?.attendances) {
      const initial: Record<string, { isPresent: boolean; absenceType?: AbsenceType }> = {};
      attendanceData.attendances.forEach((att) => {
        initial[att.studentId] = {
          isPresent: att.isPresent,
          absenceType: att.absenceType || undefined,
        };
      });
      setAttendance(initial);
    }
  }, [attendanceData]);

  const students = lesson?.group?.students || [];
  const lessonAttendances = attendanceData?.attendances || [];

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

    const attendances = students.map((student) => ({
      studentId: student.id,
      isPresent: attendance[student.id]?.isPresent ?? true,
      absenceType: attendance[student.id]?.absenceType,
    }));

    try {
      await markBulkAttendance.mutateAsync({
        lessonId: lesson.id,
        attendances,
      });

      // Mark absence as complete
      await markAbsenceComplete(lesson.id);
      
      // Invalidate lesson query to refresh data
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(lesson.id) });

      setHasChanges(false);
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Failed to save attendance:', error);
      alert('Failed to save attendance. Please try again.');
    }
  };

  const getStatus = (studentId: string): AttendanceStatus => {
    const att = attendance[studentId];
    if (!att) {
      const existing = lessonAttendances.find((a) => a.studentId === studentId);
      if (existing) {
        return existing.isPresent
          ? 'present'
          : existing.absenceType === 'JUSTIFIED'
          ? 'absent_justified'
          : 'absent_unjustified';
      }
      return 'not_marked';
    }
    return att.isPresent
      ? 'present'
      : att.absenceType === 'JUSTIFIED'
      ? 'absent_justified'
      : 'absent_unjustified';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Mark Attendance</h3>
          <p className="text-sm text-slate-500 mt-1">
            Mark attendance for all students in this lesson
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={markBulkAttendance.isPending}>
            {markBulkAttendance.isPending ? 'Saving...' : 'Save Attendance'}
          </Button>
        )}
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

