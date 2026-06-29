import { api } from '@/shared/lib/api';
import { CHAT_ENDPOINT } from './chat-api.constants';
import type {
  AdminStudentRecording,
  TeacherAdmin,
  TeacherGroup,
  TeacherStudent,
  TeacherStudentRecordingsFilters,
} from './chat-api.types';

export async function fetchTeacherGroups(search?: string): Promise<TeacherGroup[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const query = params.toString();
  const url = query ? `${CHAT_ENDPOINT}/teacher/groups?${query}` : `${CHAT_ENDPOINT}/teacher/groups`;
  return api.get<TeacherGroup[]>(url);
}

export async function fetchTeacherStudents(search?: string): Promise<TeacherStudent[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const query = params.toString();
  const url = query ? `${CHAT_ENDPOINT}/teacher/students?${query}` : `${CHAT_ENDPOINT}/teacher/students`;
  return api.get<TeacherStudent[]>(url);
}

export async function fetchTeacherAdmin(): Promise<TeacherAdmin | null> {
  return api.get<TeacherAdmin | null>(`${CHAT_ENDPOINT}/teacher/admin`);
}

/** Teacher-only: Get student voice recordings only from teacher's own groups/students. */
export async function fetchTeacherStudentRecordings(
  filters?: TeacherStudentRecordingsFilters,
): Promise<AdminStudentRecording[]> {
  const params = new URLSearchParams();
  if (filters?.groupId) params.append('groupId', filters.groupId);
  if (filters?.studentUserId) params.append('studentUserId', filters.studentUserId);
  if (filters?.search) params.append('search', filters.search);

  const query = params.toString();
  const url = query
    ? `${CHAT_ENDPOINT}/teacher/student-recordings?${query}`
    : `${CHAT_ENDPOINT}/teacher/student-recordings`;

  return api.get<AdminStudentRecording[]>(url);
}
