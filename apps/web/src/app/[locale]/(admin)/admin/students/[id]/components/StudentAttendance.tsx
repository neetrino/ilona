'use client';

import { Badge } from '@/shared/components/ui';
import type { Student } from '@/features/students';

interface StudentWithAttendances extends Student {
  attendances?: Array<{
    id: string;
    isPresent: boolean;
    absenceType?: 'JUSTIFIED' | 'UNJUSTIFIED' | null;
    lesson?: {
      id: string;
      topic?: string;
      scheduledAt: string;
    };
  }>;
}

interface StudentAttendanceProps {
  student: StudentWithAttendances;
}

export function StudentAttendance({ student }: StudentAttendanceProps) {
  if (!student.attendances || student.attendances.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Attendance</h3>
      <div className="space-y-3">
        {student.attendances.slice(0, 5).map((attendance) => (
          <div key={attendance.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-800">
                {attendance.lesson?.topic || 'Lesson'}
              </p>
              <p className="text-sm text-slate-500">
                {attendance.lesson?.scheduledAt 
                  ? new Date(attendance.lesson.scheduledAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <Badge variant={attendance.isPresent ? 'success' : 'warning'}>
              {attendance.isPresent ? 'PRESENT' : (attendance.absenceType || 'ABSENT')}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

