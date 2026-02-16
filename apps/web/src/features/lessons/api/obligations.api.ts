import { api } from '@/shared/lib/api';

const LESSONS_ENDPOINT = '/lessons';

export async function markAbsenceComplete(lessonId: string) {
  return api.patch(`${LESSONS_ENDPOINT}/${lessonId}/absence-complete`);
}

export async function markVoiceSent(lessonId: string) {
  return api.patch(`${LESSONS_ENDPOINT}/${lessonId}/voice-sent`);
}

export async function markTextSent(lessonId: string) {
  return api.patch(`${LESSONS_ENDPOINT}/${lessonId}/text-sent`);
}








