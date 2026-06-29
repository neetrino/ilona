import type { AbsenceType } from '@/features/attendance';

export type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified' | 'not_marked';

export interface AttendanceCell {
  studentId: string;
  lessonId: string;
  status: AttendanceStatus;
  isPresent: boolean;
  absenceType?: AbsenceType;
  note?: string;
}

export interface WeekAttendanceStudent {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  'not_marked',
  'present',
  'absent_justified',
  'absent_unjustified',
];
