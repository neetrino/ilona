import { api } from '@/shared/lib/api';
import type {
  LessonAttendance,
  StudentAttendanceHistory,
  AttendanceRecord,
  MarkAttendanceDto,
  BulkAttendanceDto,
  AtRiskStudent,
  GroupAttendanceReport,
  AbsenceType,
} from '../types';

const ATTENDANCE_ENDPOINT = '/attendance';

/**
 * Get attendance for a lesson
 */
export async function fetchLessonAttendance(lessonId: string): Promise<LessonAttendance> {
  return api.get<LessonAttendance>(`${ATTENDANCE_ENDPOINT}/lesson/${lessonId}`);
}

/**
 * Get attendance history for a student
 */
export async function fetchStudentAttendance(
  studentId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<StudentAttendanceHistory> {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  const query = params.toString();
  const url = query 
    ? `${ATTENDANCE_ENDPOINT}/student/${studentId}?${query}` 
    : `${ATTENDANCE_ENDPOINT}/student/${studentId}`;

  return api.get<StudentAttendanceHistory>(url);
}

/**
 * Mark single attendance
 */
export async function markAttendance(data: MarkAttendanceDto): Promise<AttendanceRecord> {
  return api.post<AttendanceRecord>(ATTENDANCE_ENDPOINT, data);
}

/**
 * Mark bulk attendance
 */
export async function markBulkAttendance(data: BulkAttendanceDto): Promise<{
  success: boolean;
  count: number;
  attendances: AttendanceRecord[];
}> {
  return api.post<{ success: boolean; count: number; attendances: AttendanceRecord[] }>(
    `${ATTENDANCE_ENDPOINT}/bulk`,
    data
  );
}

/**
 * Update absence type
 */
export async function updateAbsenceType(
  attendanceId: string,
  absenceType: AbsenceType,
  note?: string
): Promise<AttendanceRecord> {
  return api.patch<AttendanceRecord>(`${ATTENDANCE_ENDPOINT}/${attendanceId}/absence-type`, {
    absenceType,
    note,
  });
}

/**
 * Get at-risk students (too many unjustified absences)
 */
export async function fetchAtRiskStudents(): Promise<AtRiskStudent[]> {
  return api.get<AtRiskStudent[]>(`${ATTENDANCE_ENDPOINT}/at-risk`);
}

/**
 * Get group attendance report
 */
export async function fetchGroupAttendanceReport(
  groupId: string,
  dateFrom: string,
  dateTo: string
): Promise<GroupAttendanceReport> {
  return api.get<GroupAttendanceReport>(
    `${ATTENDANCE_ENDPOINT}/group/${groupId}/report?dateFrom=${dateFrom}&dateTo=${dateTo}`
  );
}
