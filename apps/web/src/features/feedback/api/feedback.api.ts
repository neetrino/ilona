import { api } from '@/shared/lib/api';
import type {
  Feedback,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  LessonFeedbackData,
} from '../types';

const FEEDBACK_ENDPOINT = '/feedback';

/**
 * Fetch feedback data for a lesson (students with their feedback)
 */
export async function fetchLessonFeedback(lessonId: string): Promise<LessonFeedbackData> {
  return api.get<LessonFeedbackData>(`${FEEDBACK_ENDPOINT}/lesson/${lessonId}`);
}

/**
 * Fetch feedback for a student
 */
export async function fetchStudentFeedback(
  studentId: string,
  dateFrom?: string,
  dateTo?: string,
  teacherId?: string | null
): Promise<Feedback[]> {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  if (teacherId) params.append('teacherId', teacherId);

  const query = params.toString();
  const url = query
    ? `${FEEDBACK_ENDPOINT}/student/${studentId}?${query}`
    : `${FEEDBACK_ENDPOINT}/student/${studentId}`;

  return api.get<Feedback[]>(url);
}

/**
 * Create or update feedback
 */
export async function createOrUpdateFeedback(dto: CreateFeedbackDto): Promise<Feedback> {
  return api.post<Feedback>(FEEDBACK_ENDPOINT, dto);
}

/**
 * Update feedback
 */
export async function updateFeedback(id: string, dto: UpdateFeedbackDto): Promise<Feedback> {
  return api.put<Feedback>(`${FEEDBACK_ENDPOINT}/${id}`, dto);
}

/**
 * Delete feedback
 */
export async function deleteFeedback(id: string): Promise<void> {
  return api.delete(`${FEEDBACK_ENDPOINT}/${id}`);
}

