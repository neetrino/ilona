import { api } from '@/shared/lib/api';
import { CHAT_ENDPOINT } from './chat-api.constants';
import type {
  RecordingsDateFilters,
  StudentAdmin,
  VoiceToTeacherRecording,
} from './chat-api.types';

export async function fetchStudentAdmin(): Promise<StudentAdmin | null> {
  return api.get<StudentAdmin | null>(`${CHAT_ENDPOINT}/student/admin`);
}

export async function fetchStudentVoiceToTeacherRecordings(
  filters?: RecordingsDateFilters,
): Promise<VoiceToTeacherRecording[]> {
  const params = new URLSearchParams();
  if (filters?.year != null) params.append('year', String(filters.year));
  if (filters?.month != null) params.append('month', String(filters.month));
  if (filters?.day != null) params.append('day', String(filters.day));
  const query = params.toString();
  const url = query
    ? `${CHAT_ENDPOINT}/student/voice-to-teacher-recordings?${query}`
    : `${CHAT_ENDPOINT}/student/voice-to-teacher-recordings`;
  return api.get<VoiceToTeacherRecording[]>(url);
}
