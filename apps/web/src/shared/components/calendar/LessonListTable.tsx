'use client';

import { useState, useMemo, useEffect, useRef, type ReactElement } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { LessonListTableBodyRow } from '@/shared/components/calendar/LessonListTableBodyRow';
import type { Lesson } from '@/features/lessons';
import { getScheduleCardDayStatus } from '@/features/schedule/schedule-dates';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Badge } from '@/shared/components/ui/badge';
import { CalendarListActionPill } from '@/shared/components/calendar/CalendarListActionPill';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { isAdminPortalPath, getTeacherDailyDutiesLessonPath } from '@/shared/lib/role-routes';
import { getLessonActionsDerived, type LessonActionId } from '@/shared/lib/calendar/lesson-action-states';
import {
  buildTeacherCalendarOrderedRows,
  TEACHER_CALENDAR_LIST_PAGE_SIZE,
  teacherCalendarRowSection,
} from '@/shared/lib/calendar/teacher-calendar-list-order';
import type { TeacherCalendarRowCategory } from '@/shared/lib/calendar/teacher-calendar-list-order';

interface LessonListTableProps {
  lessons: Lesson[];
  isLoading?: boolean;
  onBulkDelete?: (lessonIds: string[]) => void;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onComplete?: (lessonId: string) => void;
  /** Admin calendar: open substitute-teacher dialog for this lesson */
  onAssignSubstitute?: (lessonId: string) => void;
  onObligationClick?: (
    lessonId: string,
    obligation: 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan'
  ) => void;
  hideTeacherColumn?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  /** When true, bulk action bar stays visible even with no selected rows (admin calendar). */
  showBulkBarWhenEmpty?: boolean;
  /**
   * List view: completed first, then next 2 upcoming, today, later; Schedule column; 10 rows per page.
   * Used for teacher and admin calendar list.
   */
  sectionedCalendarList?: boolean;
  /** Controls Schedule column visibility in sectioned calendar list tables. */
  showScheduleColumn?: boolean;
  /** Enables card-style mobile layout for admin calendar list. */
  useMobileCards?: boolean;
  /** When set, section headers (completed / today / upcoming) use this instant instead of now. */
  listReferenceDate?: Date;
  /** Desktop table: hide actions column and open lesson detail on row click. */
  hideActionsColumn?: boolean;
  /** Mobile cards: open lesson in a sheet instead of navigating. */
  onMobileCardClick?: (lessonId: string, tab?: LessonActionId) => void;
}

const MOBILE_CARD_PAGE_SIZE = 5;
const IPAD_CARD_PAGE_SIZE = 10;

export function LessonListTable({
  lessons,
  isLoading = false,
  onBulkDelete,
  onEdit,
  onDelete,
  onComplete,
  onAssignSubstitute,
  onObligationClick,
  hideTeacherColumn = false,
  sortBy,
  sortOrder,
  onSort,
  showBulkBarWhenEmpty = false,
  sectionedCalendarList = false,
  showScheduleColumn = true,
  useMobileCards = false,
  listReferenceDate,
  hideActionsColumn = false,
  onMobileCardClick,
}: LessonListTableProps) {
  const locale = useLocale();
  const tCal = useTranslations('calendar');
  const tCommon = useTranslations('common');
  const tActions = useTranslations('calendar.lessonActions');
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [sectionedListPage, setSectionedListPage] = useState(1);
  const [mobileCardsPage, setMobileCardsPage] = useState(1);
  const [isIPad, setIsIPad] = useState(false);
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';
  const router = useRouter();
  const mobileCardsStartRef = useRef<HTMLDivElement | null>(null);

  const sectionedOrderedRows = useMemo(
    () =>
      sectionedCalendarList
        ? buildTeacherCalendarOrderedRows(lessons, listReferenceDate ?? new Date())
        : [],
    [lessons, sectionedCalendarList, listReferenceDate],
  );

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const platform = navigator.platform ?? '';
    const userAgent = navigator.userAgent ?? '';
    const detectedIPad =
      /iPad/i.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    setIsIPad(detectedIPad);
  }, []);

  const sectionedLessonsKey = useMemo(() => lessons.map((l) => l.id).join('|'), [lessons]);

  useEffect(() => {
    if (sectionedCalendarList) {
      setSectionedListPage(1);
    }
  }, [sectionedCalendarList, sectionedLessonsKey]);

  const sectionedTotalPages = Math.max(
    1,
    Math.ceil(sectionedOrderedRows.length / TEACHER_CALENDAR_LIST_PAGE_SIZE),
  );

  useEffect(() => {
    if (sectionedCalendarList && sectionedListPage > sectionedTotalPages) {
      setSectionedListPage(sectionedTotalPages);
    }
  }, [sectionedCalendarList, sectionedListPage, sectionedTotalPages]);

  const sectionedPageRows = useMemo(() => {
    if (!sectionedCalendarList) return [];
    return sectionedOrderedRows.slice(
      (sectionedListPage - 1) * TEACHER_CALENDAR_LIST_PAGE_SIZE,
      sectionedListPage * TEACHER_CALENDAR_LIST_PAGE_SIZE,
    );
  }, [sectionedCalendarList, sectionedOrderedRows, sectionedListPage]);

  const sectionedPageLessonIds = useMemo(
    () => sectionedPageRows.map((r) => r.lesson.id),
    [sectionedPageRows],
  );

  const scheduleCategoryLabels = useMemo(
    () => ({
      upcoming: tCal('scheduleStatusUpcoming'),
      upcomingNext: tCal('scheduleStatusNext'),
      today: tCal('scheduleStatusToday'),
      completed: tCal('scheduleStatusCompleted'),
      todayPastSlot: tCal('scheduleTodayPastSlot'),
    }),
    [tCal],
  );

  // Sort lessons: Respect server-side sort order when sorting by scheduledAt
  // Otherwise, apply completion status grouping
  const sortedLessons = useMemo(() => {
    const sorted = [...lessons];
    
    // If explicitly sorting by scheduledAt, respect the server sort order
    if (sortBy === 'scheduledAt' && sortOrder) {
      sorted.sort((a, b) => {
        const aTime = new Date(a.scheduledAt).getTime();
        const bTime = new Date(b.scheduledAt).getTime();
        // Apply completion status grouping as secondary sort
        if (a.completionStatus === 'DONE' && b.completionStatus !== 'DONE') return 1;
        if (a.completionStatus !== 'DONE' && b.completionStatus === 'DONE') return -1;
        // Then sort by scheduledAt according to sortOrder
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      });
    } else {
      // Default behavior: Done lessons go to bottom, then sort by scheduledAt desc
      sorted.sort((a, b) => {
        // If both have completionStatus, Done goes to bottom
        if (a.completionStatus === 'DONE' && b.completionStatus !== 'DONE') return 1;
        if (a.completionStatus !== 'DONE' && b.completionStatus === 'DONE') return -1;
        // If both are IN_PROCESS or both are Done, maintain original order (by scheduledAt)
        const aTime = new Date(a.scheduledAt).getTime();
        const bTime = new Date(b.scheduledAt).getTime();
        return bTime - aTime; // Most recent first within same status
      });
    }
    
    return sorted;
  }, [lessons, sortBy, sortOrder]);

  const lessonIdSet = useMemo(() => new Set(lessons.map((l) => l.id)), [lessons]);

  useEffect(() => {
    setSelectedLessons((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (lessonIdSet.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [lessonIdSet]);

  const handleSelectAll = (checked: boolean) => {
    if (sectionedCalendarList) {
      if (checked) {
        setSelectedLessons(new Set(sectionedPageLessonIds));
      } else {
        setSelectedLessons(new Set());
      }
      return;
    }
    if (checked) {
      setSelectedLessons(new Set(lessons.map((l) => l.id)));
    } else {
      setSelectedLessons(new Set());
    }
  };

  const handleSelectLesson = (lessonId: string, checked: boolean) => {
    const newSelected = new Set(selectedLessons);
    if (checked) {
      newSelected.add(lessonId);
    } else {
      newSelected.delete(lessonId);
    }
    setSelectedLessons(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedLessons.size > 0 && onBulkDelete) {
      onBulkDelete(Array.from(selectedLessons));
      // Don't clear selection here - let parent handle it after confirmation
    }
  };

  const cardRows = useMemo<Array<{ lesson: Lesson; category?: TeacherCalendarRowCategory }>>(
    () =>
      sectionedCalendarList
        ? (useMobileCards
            ? sectionedOrderedRows.map((row) => ({ lesson: row.lesson, category: row.category }))
            : sectionedPageRows.map((row) => ({ lesson: row.lesson, category: row.category })))
        : sortedLessons.map((lesson) => ({ lesson })),
    [sectionedCalendarList, useMobileCards, sectionedOrderedRows, sectionedPageRows, sortedLessons],
  );
  const mobileCardPageSize = isIPad ? IPAD_CARD_PAGE_SIZE : MOBILE_CARD_PAGE_SIZE;
  const mobileCardsTotalPages = Math.max(
    1,
    Math.ceil(cardRows.length / mobileCardPageSize),
  );
  const safeMobileCardsPage = Math.min(mobileCardsPage, mobileCardsTotalPages);
  const mobilePaginatedCardRows = useMemo(
    () =>
      cardRows.slice(
        (safeMobileCardsPage - 1) * mobileCardPageSize,
        safeMobileCardsPage * mobileCardPageSize,
      ),
    [cardRows, safeMobileCardsPage, mobileCardPageSize],
  );

  useEffect(() => {
    setMobileCardsPage(1);
  }, [sectionedCalendarList, sectionedLessonsKey, sortedLessons.length]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500">{tCal('noLessons')}</p>
      </div>
    );
  }

  const tableColSpan =
    (hideActionsColumn ? 8 : 9) +
    (sectionedCalendarList && showScheduleColumn ? 1 : 0) +
    (hideTeacherColumn ? 0 : 1);

  const allSelected = sectionedCalendarList
    ? sectionedPageLessonIds.length > 0 && sectionedPageLessonIds.every((id) => selectedLessons.has(id))
    : lessons.length > 0 && selectedLessons.size === lessons.length;
  const someSelected = sectionedCalendarList
    ? sectionedPageLessonIds.some((id) => selectedLessons.has(id)) && !allSelected
    : selectedLessons.size > 0 && selectedLessons.size < lessons.length;
  const showBulkBar = onBulkDelete && (showBulkBarWhenEmpty || selectedLessons.size > 0);
  const hasSelectedLessons = selectedLessons.size > 0;
  const obligationIds: LessonActionId[] = ['absence', 'feedback', 'voice', 'text', 'dailyPlan'];
  const mobileCardOpensSheet = Boolean(onMobileCardClick);

  const handleView = (lessonId: string) => {
    const currentPath = window.location.pathname;
    if (isAdminPortalPath(currentPath.replace(/^\/[a-z]{2}\//, '/'))) {
      const portalRoot = currentPath.includes('/manager/') ? '/manager' : '/admin';
      router.push(`${portalRoot}/calendar/${lessonId}`);
      return;
    }
    if (currentPath.includes('/teacher/')) {
      router.push(getTeacherDailyDutiesLessonPath(lessonId));
      return;
    }
    router.push(`/calendar/${lessonId}`);
  };

  const goToMobileCardsPage = (nextPage: number) => {
    setMobileCardsPage(nextPage);
    requestAnimationFrame(() => {
      mobileCardsStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Bulk Actions */}
      {showBulkBar && (
        <div className="px-6 py-3 bg-blue-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-blue-900">
            {selectedLessons.size === 0
              ? tCal('bulkSelectHint')
              : tCal('lessonsSelected', { count: selectedLessons.size })}
          </span>
          <div
            className={cn(
              'overflow-hidden transition-all duration-200 ease-out',
              hasSelectedLessons
                ? 'max-w-[11rem] translate-x-0 opacity-100'
                : 'max-w-0 translate-x-2 opacity-0',
            )}
            aria-hidden={!hasSelectedLessons}
          >
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              tabIndex={hasSelectedLessons ? 0 : -1}
            >
              {allSelected
                ? tCal('deleteAll', { count: selectedLessons.size })
                : tCal('deleteSelected', { count: selectedLessons.size })}
            </Button>
          </div>
        </div>
      )}

      <div
        className={cn(
          isIPad ? 'grid grid-cols-2 gap-3 p-3' : 'space-y-3 p-3',
          !useMobileCards && 'hidden',
          !isIPad && 'sm:hidden',
        )}
      >
        <div ref={mobileCardsStartRef} className={cn(isIPad && 'col-span-2')} />
        {mobilePaginatedCardRows.map((row, idx) => {
          const lesson = row.lesson;
          const actions = getLessonActionsDerived(lesson);
          const actionMap = new Map(actions.map((action) => [action.id, action]));
          const isLocked = isTeacher && lesson.isLockedForTeacher;
          const section = row.category ? teacherCalendarRowSection(row.category) : null;
          const globalRowIndex =
            (safeMobileCardsPage - 1) * mobileCardPageSize + idx;
          const prevGlobalRow = globalRowIndex > 0 ? cardRows[globalRowIndex - 1] : null;
          const prevSection =
            prevGlobalRow?.category
              ? teacherCalendarRowSection(prevGlobalRow.category)
              : null;
          const showSectionHeader = sectionedCalendarList && section !== prevSection;

          return (
            <div key={lesson.id} className={cn(isIPad && showSectionHeader && 'contents')}>
              {showSectionHeader ? (
                <p className={cn('mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500', isIPad && 'col-span-2')}>
                  {section === 'upcoming'
                    ? tCal('sectionUpcoming')
                    : section === 'today'
                      ? tCal('sectionToday')
                      : tCal('sectionCompleted')}
                </p>
              ) : null}
              <article
                role={mobileCardOpensSheet ? 'button' : undefined}
                tabIndex={mobileCardOpensSheet ? 0 : undefined}
                onClick={
                  mobileCardOpensSheet
                    ? () => onMobileCardClick?.(lesson.id)
                    : undefined
                }
                onKeyDown={
                  mobileCardOpensSheet
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onMobileCardClick?.(lesson.id);
                        }
                      }
                    : undefined
                }
                className={cn(
                  'overflow-hidden rounded-2xl border border-[rgba(14,14,16,0.09)] bg-white shadow-[0_1px_2px_rgba(14,14,16,0.03)]',
                  mobileCardOpensSheet &&
                    'cursor-pointer transition-shadow hover:shadow-[0_4px_14px_rgba(14,14,16,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/25',
                )}
              >
                <div className="p-4">
                  <div className="flex items-start gap-2.5">
                    <div onPointerDown={(event) => event.stopPropagation()}>
                      <Checkbox
                        checked={selectedLessons.has(lesson.id)}
                        onCheckedChange={(checked) => handleSelectLesson(lesson.id, checked === true)}
                        className="relative -top-[1px] h-5 w-5 rounded-md"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-normal break-words text-[1.2rem] leading-tight font-semibold text-[#111827]">
                        {lesson.group?.name || tCal('unknownGroupName')}
                      </p>
                      {lesson.completionStatus === 'DONE' ? (
                        <div className="mt-1">
                          <Badge variant="success" className="bg-green-100 text-green-700 border-green-200">
                            {tCal('completed')}
                          </Badge>
                        </div>
                      ) : lesson.completionStatus === 'IN_PROCESS' ? (
                        <div className="mt-1">
                          <Badge variant="warning" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            {tCal('statusInProcess')}
                          </Badge>
                        </div>
                      ) : null}
                      <div className="mt-5 -ml-[31px] grid grid-cols-2 items-stretch gap-3">
                        <div className="justify-self-start flex items-start gap-2">
                          <svg
                            className="mt-0.5 h-5 w-5 shrink-0 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                          </svg>
                          <div className="min-w-0">
                            <p className="text-left text-[11px] font-medium text-[#1f2937]">
                              {new Date(lesson.scheduledAt).toLocaleDateString(locale === 'hy' ? 'hy-AM' : 'en-GB', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="mt-0.5 text-left text-[2rem] leading-none font-medium text-[#111827]">
                              {new Date(lesson.scheduledAt).toLocaleTimeString(
                                locale === 'hy' ? 'hy-AM' : 'en-US',
                                { hour: '2-digit', minute: '2-digit', hour12: false },
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="pl-3">
                          <div className="flex items-start gap-2">
                            <User className="mt-0.5 h-5 w-5 shrink-0 text-green-500" aria-hidden />
                            <p className="line-clamp-2 text-[1.2rem] leading-tight font-medium text-[#111827]">
                              {lesson.teacher?.user
                                ? `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`
                                : tCal('unknownTeacher')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="my-3 border-t border-dashed border-[rgba(14,14,16,0.14)]" />
                  <div className="grid grid-cols-3 gap-2" onPointerDown={(event) => event.stopPropagation()}>
                    {obligationIds.map((id) => (
                      <CalendarListActionPill
                        key={id}
                        action={actionMap.get(id)!}
                        onActivate={() => {
                          if (mobileCardOpensSheet) {
                            onMobileCardClick?.(lesson.id, id);
                            return;
                          }
                          onObligationClick?.(lesson.id, id);
                        }}
                      />
                    ))}
                  </div>
                </div>
                {!mobileCardOpensSheet ? (
                <div className="flex items-center justify-around gap-2 border-t border-[rgba(14,14,16,0.08)] bg-[#fbfbfc] px-4 py-2.5">
                  {!isTeacher && onAssignSubstitute ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAssignSubstitute(lesson.id)}
                      className="h-auto px-2 py-1 text-green-600 hover:text-green-700"
                      title={tCal('assignSubstituteTitle')}
                    >
                      <span className="flex flex-col items-center gap-0.5">
                        <Image
                          src="/icons/substitute-teacher.svg"
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 shrink-0"
                          aria-hidden
                        />
                        <span className="text-[11px] leading-none">{tCommon('edit')}</span>
                      </span>
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(lesson.id)}
                    className="h-auto px-2 py-1 text-blue-600 hover:text-blue-700"
                  >
                    <span className="flex flex-col items-center gap-0.5">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-[11px] leading-none">{tCommon('view')}</span>
                    </span>
                  </Button>
                  {onDelete ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(lesson.id)}
                      disabled={isLocked}
                      className={cn('h-auto px-2 py-1 text-red-600 hover:text-red-700', isLocked && 'opacity-75 cursor-not-allowed')}
                      title={isLocked ? tCal('lessonLockedDelete') : tCommon('delete')}
                    >
                      <span className="flex flex-col items-center gap-0.5">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-[11px] leading-none">{tCommon('delete')}</span>
                      </span>
                    </Button>
                  ) : null}
                </div>
                ) : null}
              </article>
            </div>
          );
        })}
        {cardRows.length > mobileCardPageSize && (
          <div className={cn('flex items-center justify-between px-1 text-sm text-[#8b8b90]', isIPad && 'col-span-2')}>
            <span>
              {(safeMobileCardsPage - 1) * mobileCardPageSize + 1}-
              {Math.min(
                safeMobileCardsPage * mobileCardPageSize,
                cardRows.length,
              )}{' '}
              / {cardRows.length}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  safeMobileCardsPage <= 1
                    ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                    : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                }`}
                disabled={safeMobileCardsPage <= 1}
                onClick={() => goToMobileCardsPage(Math.max(1, safeMobileCardsPage - 1))}
                aria-label={tCal('paginationPrevious')}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
                {safeMobileCardsPage}
              </span>
              <button
                type="button"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  safeMobileCardsPage >= mobileCardsTotalPages
                    ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                    : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                }`}
                disabled={safeMobileCardsPage >= mobileCardsTotalPages}
                onClick={() =>
                  goToMobileCardsPage(
                    Math.min(mobileCardsTotalPages, safeMobileCardsPage + 1),
                  )
                }
                aria-label={tCal('paginationNext')}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div
        className={cn(
          'overflow-x-auto',
          useMobileCards && !isIPad && 'hidden sm:block',
          useMobileCards && isIPad && 'hidden',
        )}
      >
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                {tCal('columnLessonName')}
              </th>
              {sectionedCalendarList && showScheduleColumn && (
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase min-w-[7rem]">
                  {tCal('scheduleCategoryColumn')}
                </th>
              )}
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                {!sectionedCalendarList && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort('scheduledAt')}
                    className={cn(
                      'mx-auto flex items-center justify-center gap-1.5 text-xs font-semibold uppercase hover:bg-slate-50 rounded-md px-0 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1',
                      sortBy === 'scheduledAt' && 'text-slate-700',
                    )}
                    aria-label={
                      sortBy !== 'scheduledAt'
                        ? tCal('sortByDateTime')
                        : sortOrder === 'asc'
                          ? tCal('sortByDateTimeAsc')
                          : tCal('sortByDateTimeDesc')
                    }
                  >
                    <span>{tCal('columnDateTime')}</span>
                    <span className="flex-shrink-0">
                      {sortBy === 'scheduledAt' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                ) : (
                  tCal('columnDateTime')
                )}
              </th>
              {!hideTeacherColumn && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                  {tCommon('teacher')}
                </th>
              )}
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">
                {tActions('absenceLabel')}
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">
                {tActions('feedbackLabel')}
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">
                {tActions('voiceLabel')}
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">
                {tActions('textLabel')}
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">
                {tActions('dailyPlanLabel')}
              </th>
              {!hideActionsColumn && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                  {tCommon('actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sectionedCalendarList
              ? sectionedPageRows.flatMap((row, idx) => {
                  const globalIdx = (sectionedListPage - 1) * TEACHER_CALENDAR_LIST_PAGE_SIZE + idx;
                  const prevGlobal = globalIdx > 0 ? sectionedOrderedRows[globalIdx - 1] : undefined;
                  const section = teacherCalendarRowSection(row.category);
                  const prevSection = prevGlobal ? teacherCalendarRowSection(prevGlobal.category) : null;
                  const showSectionHeader = section !== prevSection;
                  const nodes: ReactElement[] = [];
                  if (showSectionHeader) {
                    const title =
                      section === 'upcoming'
                        ? tCal('sectionUpcoming')
                        : section === 'today'
                          ? tCal('sectionToday')
                          : tCal('sectionCompleted');
                    nodes.push(
                      <tr
                        key={`sec-${sectionedListPage}-${section}-${idx}`}
                        className="bg-slate-100/95 border-y border-slate-200"
                      >
                        <td
                          colSpan={tableColSpan}
                          className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700"
                        >
                          {title}
                        </td>
                      </tr>,
                    );
                  }
                  nodes.push(
                    <LessonListTableBodyRow
                      key={row.lesson.id}
                      lesson={row.lesson}
                      locale={locale}
                      hideTeacherColumn={hideTeacherColumn}
                      isTeacher={isTeacher}
                      isSelected={selectedLessons.has(row.lesson.id)}
                      onSelectLesson={handleSelectLesson}
                      dateStatus={getScheduleCardDayStatus(row.lesson.scheduledAt)}
                      onObligationClick={onObligationClick}
                      onComplete={onComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAssignSubstitute={onAssignSubstitute}
                      hideActionsColumn={hideActionsColumn}
                      onRowClick={hideActionsColumn ? handleView : undefined}
                      scheduleCategory={showScheduleColumn ? row.category : undefined}
                      scheduleCategoryLabels={scheduleCategoryLabels}
                    />,
                  );
                  return nodes;
                })
              : sortedLessons.map((lesson) => (
                  <LessonListTableBodyRow
                    key={lesson.id}
                    lesson={lesson}
                    locale={locale}
                    hideTeacherColumn={hideTeacherColumn}
                    isTeacher={isTeacher}
                    isSelected={selectedLessons.has(lesson.id)}
                    onSelectLesson={handleSelectLesson}
                    dateStatus={getScheduleCardDayStatus(lesson.scheduledAt)}
                    onObligationClick={onObligationClick}
                    onComplete={onComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAssignSubstitute={onAssignSubstitute}
                    hideActionsColumn={hideActionsColumn}
                    onRowClick={hideActionsColumn ? handleView : undefined}
                    scheduleCategoryLabels={scheduleCategoryLabels}
                  />
                ))}
          </tbody>
        </table>
      </div>
      {sectionedCalendarList && sectionedTotalPages > 1 && (
        <div
          className={cn(
            'flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:justify-start lg:gap-4',
            useMobileCards && 'hidden'
          )}
        >
          <p className="text-center text-sm text-slate-600 sm:text-left">
            {tCal('paginationSummary', {
              showingFrom: (sectionedListPage - 1) * TEACHER_CALENDAR_LIST_PAGE_SIZE + 1,
              showingTo: Math.min(
                sectionedListPage * TEACHER_CALENDAR_LIST_PAGE_SIZE,
                sectionedOrderedRows.length,
              ),
              total: sectionedOrderedRows.length,
            })}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={sectionedListPage <= 1}
              onClick={() => setSectionedListPage((p) => Math.max(1, p - 1))}
              aria-label={tCal('paginationPrevious')}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{tCal('paginationPrevious')}</span>
            </Button>
            <span className="min-w-[6.5rem] text-center text-sm font-medium text-slate-800">
              {tCal('paginationPageOf', { current: sectionedListPage, total: sectionedTotalPages })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={sectionedListPage >= sectionedTotalPages}
              onClick={() => setSectionedListPage((p) => Math.min(sectionedTotalPages, p + 1))}
              aria-label={tCal('paginationNext')}
            >
              <span className="hidden sm:inline">{tCal('paginationNext')}</span>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

