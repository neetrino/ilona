import { api } from '@/shared/lib/api';
import type {
  Lesson,
  LessonsResponse,
  LessonFilters,
  CreateLessonDto,
  UpdateLessonDto,
  CompleteLessonDto,
  CreateRecurringLessonsDto,
  LessonStatistics,
} from '../types';

const LESSONS_ENDPOINT = '/lessons';

/**
 * Fetch all lessons with optional filters
 */
export async function fetchLessons(filters?: LessonFilters): Promise<LessonsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
  if (filters?.take !== undefined) params.append('take', String(filters.take));
  if (filters?.groupId) params.append('groupId', filters.groupId);
  if (filters?.teacherId) params.append('teacherId', filters.teacherId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const query = params.toString();
  const url = query ? `${LESSONS_ENDPOINT}?${query}` : LESSONS_ENDPOINT;
  
  return api.get<LessonsResponse>(url);
}

/**
 * Fetch a single lesson by ID
 */
export async function fetchLesson(id: string): Promise<Lesson> {
  return api.get<Lesson>(`${LESSONS_ENDPOINT}/${id}`);
}

/**
 * Fetch today's lessons for current teacher
 */
export async function fetchTodayLessons(): Promise<Lesson[]> {
  return api.get<Lesson[]>(`${LESSONS_ENDPOINT}/today`);
}

/**
 * Fetch upcoming lessons for current teacher
 */
export async function fetchUpcomingLessons(limit = 10): Promise<Lesson[]> {
  return api.get<Lesson[]>(`${LESSONS_ENDPOINT}/upcoming?limit=${limit}`);
}

/**
 * Fetch teacher's lessons with date filter
 */
export async function fetchMyLessons(dateFrom?: string, dateTo?: string): Promise<LessonsResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  
  const query = params.toString();
  const url = query ? `${LESSONS_ENDPOINT}/my-lessons?${query}` : `${LESSONS_ENDPOINT}/my-lessons`;
  
  return api.get<LessonsResponse>(url);
}

/**
 * Fetch lesson statistics
 */
export async function fetchLessonStatistics(
  teacherId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<LessonStatistics> {
  const params = new URLSearchParams();
  if (teacherId) params.append('teacherId', teacherId);
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  const query = params.toString();
  const url = query ? `${LESSONS_ENDPOINT}/statistics?${query}` : `${LESSONS_ENDPOINT}/statistics`;
  
  return api.get<LessonStatistics>(url);
}

/**
 * Create a new lesson
 */
export async function createLesson(data: CreateLessonDto): Promise<Lesson> {
  return api.post<Lesson>(LESSONS_ENDPOINT, data);
}

/**
 * Create recurring lessons
 */
export async function createRecurringLessons(data: CreateRecurringLessonsDto): Promise<Lesson[]> {
  return api.post<Lesson[]>(`${LESSONS_ENDPOINT}/recurring`, data);
}

/**
 * Update an existing lesson
 */
export async function updateLesson(id: string, data: UpdateLessonDto): Promise<Lesson> {
  return api.put<Lesson>(`${LESSONS_ENDPOINT}/${id}`, data);
}

/**
 * Start a lesson
 */
export async function startLesson(id: string): Promise<Lesson> {
  return api.patch<Lesson>(`${LESSONS_ENDPOINT}/${id}/start`, {});
}

/**
 * Complete a lesson
 */
export async function completeLesson(id: string, data?: CompleteLessonDto): Promise<Lesson> {
  return api.patch<Lesson>(`${LESSONS_ENDPOINT}/${id}/complete`, data || {});
}

/**
 * Cancel a lesson
 */
export async function cancelLesson(id: string, reason?: string): Promise<Lesson> {
  return api.patch<Lesson>(`${LESSONS_ENDPOINT}/${id}/cancel`, { reason });
}

/**
 * Mark lesson as missed
 */
export async function markLessonMissed(id: string): Promise<Lesson> {
  return api.patch<Lesson>(`${LESSONS_ENDPOINT}/${id}/missed`, {});
}

/**
 * Mark vocabulary as sent
 */
export async function markVocabularySent(id: string): Promise<Lesson> {
  return api.patch<Lesson>(`${LESSONS_ENDPOINT}/${id}/vocabulary-sent`, {});
}

/**
 * Delete a lesson
 */
export async function deleteLesson(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${LESSONS_ENDPOINT}/${id}`);
}
