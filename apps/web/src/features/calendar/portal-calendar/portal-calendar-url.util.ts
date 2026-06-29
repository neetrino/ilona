import { readUrlSearchParam } from '@/shared/lib/url-search-params';

export const CALENDAR_MODAL_QUERY_KEY = 'modal';
export const ADD_LESSON_MODAL_QUERY_VALUE = 'add-lesson';
export const SUBSTITUTE_LESSON_MODAL_QUERY_VALUE = 'substitute-lesson';
export const SUBSTITUTE_LESSON_ID_QUERY_KEY = 'substituteLessonId';

export function isAddLessonModalOpen(searchParams: URLSearchParams): boolean {
  return readUrlSearchParam(CALENDAR_MODAL_QUERY_KEY, searchParams) === ADD_LESSON_MODAL_QUERY_VALUE;
}

export function readSubstituteLessonModalFromUrl(searchParams: URLSearchParams): {
  open: boolean;
  lessonId: string | null;
} {
  const modal = readUrlSearchParam(CALENDAR_MODAL_QUERY_KEY, searchParams);
  const lessonId = readUrlSearchParam(SUBSTITUTE_LESSON_ID_QUERY_KEY, searchParams);
  if (modal === SUBSTITUTE_LESSON_MODAL_QUERY_VALUE && lessonId) {
    return { open: true, lessonId };
  }
  return { open: false, lessonId: null };
}
