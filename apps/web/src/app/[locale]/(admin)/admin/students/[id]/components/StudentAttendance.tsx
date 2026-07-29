'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/shared/components/ui';
import { formatDate } from '@/shared/lib/utils';
import type { Student } from '@/features/students';

interface StudentWithAttendances extends Student {
  attendances?: Array<{
    id: string;
    isPresent: boolean;
    absenceType?: 'JUSTIFIED' | 'UNJUSTIFIED' | null;
    note?: string;
    markedBy?: {
      id: string;
      firstName: string;
      lastName: string;
      role: 'ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT';
    } | null;
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
  const t = useTranslations('students');
  const locale = useLocale();
  if (!student.attendances || student.attendances.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
      <h3 className="text-lg font-semibold text-[#3b3b40] mb-4">{t('recentAttendance')}</h3>
      <div className="space-y-3">
        {student.attendances.slice(0, 5).map((attendance) => (
          <div key={attendance.id} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-lg">
            <div>
              <p className="font-medium text-[#3b3b40]">
                {attendance.lesson?.topic || 'Lesson'}
              </p>
              <p className="text-sm text-[#8b8b90]">
                {attendance.lesson?.scheduledAt
                  ? formatDate(attendance.lesson.scheduledAt, locale)
                  : 'N/A'}
              </p>
            </div>
            <Badge variant={attendance.isPresent ? 'success' : 'warning'}>
              {attendance.isPresent ? 'PRESENT' : (attendance.absenceType || 'ABSENT')}
            </Badge>
            {!attendance.isPresent && attendance.note && (
              <p className="mt-1 text-xs text-[#3b3b40] max-w-[280px] text-right">{attendance.note}</p>
            )}
            {!attendance.isPresent && attendance.markedBy && (
              <p className="mt-1 text-xs text-[#8b8b90] max-w-[280px] text-right">
                By: {attendance.markedBy.firstName} {attendance.markedBy.lastName}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

