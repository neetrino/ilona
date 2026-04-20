import { api } from '@/shared/lib/api';
import type { TeacherNote } from './types';

const ENDPOINT = '/teacher-notes/me';

export async function fetchTeacherNotes(): Promise<TeacherNote[]> {
  return api.get<TeacherNote[]>(ENDPOINT);
}

export async function createTeacherNote(content: string): Promise<TeacherNote> {
  return api.post<TeacherNote>(ENDPOINT, { content });
}

export async function deleteTeacherNote(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${ENDPOINT}/${id}`);
}
