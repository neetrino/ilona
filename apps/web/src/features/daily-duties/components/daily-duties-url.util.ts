import { getLiveSearchParams, readUrlSearchParam } from '@/shared/lib/url-search-params';
import { getCurrentReturnToPath } from '@/shared/lib/return-navigation';
import { formatScheduleDate, getWeekDates } from '@/features/schedule/schedule-dates';

export const DAILY_DUTIES_MODAL_QUERY_KEY = 'modal';
export const ADD_LESSON_MODAL_QUERY_VALUE = 'add-lesson';
export const SUBSTITUTE_LESSON_MODAL_QUERY_VALUE = 'substitute-lesson';
export const SUBSTITUTE_LESSON_ID_QUERY_KEY = 'substituteLessonId';
export const DAILY_DUTIES_WEEK_QUERY_KEY = 'week';
export const DAILY_DUTIES_MONTH_QUERY_KEY = 'month';
export const RETURN_TO_QUERY_KEY = 'returnTo';

export function readDailyDutiesTeacherIdsFromUrl(searchParams: URLSearchParams): string[] {
  const live = getLiveSearchParams(searchParams);
  const ids = live
    .getAll('teacherIds')
    .flatMap((value) => value.split(',').map((id) => id.trim()).filter(Boolean));

  if (ids.length > 0) {
    return ids;
  }

  const legacyTeacherId = live.get('teacherId');
  return legacyTeacherId ? [legacyTeacherId] : [];
}

export function hasDailyDutiesTeacherFilterInUrl(searchParams: URLSearchParams): boolean {
  const live = getLiveSearchParams(searchParams);
  return live.has('teacherIds') || live.has('teacherId');
}

export function readDailyDutiesStatusesFromUrl(searchParams: URLSearchParams): string[] {
  const live = getLiveSearchParams(searchParams);
  const ids = live
    .getAll('statuses')
    .flatMap((value) => value.split(',').map((id) => id.trim()).filter(Boolean));

  if (ids.length > 0) {
    return ids;
  }

  const legacyStatus = live.get('status');
  return legacyStatus ? [legacyStatus] : [];
}

export function hasDailyDutiesStatusFilterInUrl(searchParams: URLSearchParams): boolean {
  const live = getLiveSearchParams(searchParams);
  return live.has('statuses') || live.has('status');
}

export function isAddLessonModalOpen(searchParams: URLSearchParams): boolean {
  return readUrlSearchParam(DAILY_DUTIES_MODAL_QUERY_KEY, searchParams) === ADD_LESSON_MODAL_QUERY_VALUE;
}

export function readSubstituteLessonModalFromUrl(searchParams: URLSearchParams): {
  open: boolean;
  lessonId: string | null;
} {
  const modal = readUrlSearchParam(DAILY_DUTIES_MODAL_QUERY_KEY, searchParams);
  const lessonId = readUrlSearchParam(SUBSTITUTE_LESSON_ID_QUERY_KEY, searchParams);
  if (modal === SUBSTITUTE_LESSON_MODAL_QUERY_VALUE && lessonId) {
    return { open: true, lessonId };
  }
  return { open: false, lessonId: null };
}

export function formatDailyDutiesMonthParam(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatDailyDutiesWeekParam(date: Date): string {
  return formatScheduleDate(getWeekDates(date)[0]);
}

export function parseDailyDutiesMonthParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, 1, 12, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseDailyDutiesWeekParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildDailyDutiesLessonDetailHref(options: {
  locale: string;
  portalBasePath: string;
  lessonId: string;
  tab?: string;
  returnTo?: string;
}): string {
  const params = new URLSearchParams();
  if (options.tab) {
    params.set('tab', options.tab);
  }
  const returnTo = options.returnTo ?? getCurrentReturnToPath();
  if (returnTo) {
    params.set(RETURN_TO_QUERY_KEY, returnTo);
  }
  const query = params.toString();
  return `/${options.locale}${options.portalBasePath}/${options.lessonId}${query ? `?${query}` : ''}`;
}
