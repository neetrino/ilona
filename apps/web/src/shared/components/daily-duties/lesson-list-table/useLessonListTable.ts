import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  buildTeacherDailyDutiesOrderedRows,
  TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE,
} from '@/shared/lib/daily-duties/teacher-daily-duties-list-order';
import type { LessonListTableProps, LessonListCardRow } from './lesson-list-table.types';
import { sortLessonListRows } from './lesson-list-table-sort.util';
import { navigateToLessonDetail } from './lesson-list-table-navigation.util';
import { IPAD_CARD_PAGE_SIZE, MOBILE_CARD_PAGE_SIZE } from './lesson-list-table.constants';

export function useLessonListTable({
  lessons,
  onBulkDelete,
  sortBy,
  sortOrder,
  sectionedCalendarList = false,
  useMobileCards = false,
  listReferenceDate,
  showBulkBarWhenEmpty = false,
  hideActionsColumn = false,
  hideTeacherColumn = false,
  showScheduleColumn = true,
}: Pick<
  LessonListTableProps,
  | 'lessons'
  | 'onBulkDelete'
  | 'sortBy'
  | 'sortOrder'
  | 'sectionedCalendarList'
  | 'useMobileCards'
  | 'listReferenceDate'
  | 'showBulkBarWhenEmpty'
  | 'hideActionsColumn'
  | 'hideTeacherColumn'
  | 'showScheduleColumn'
>) {
  const tCal = useTranslations('dailyDuties');
  const router = useRouter();
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';

  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [sectionedListPage, setSectionedListPage] = useState(1);
  const [mobileCardsPage, setMobileCardsPage] = useState(1);
  const [isIPad, setIsIPad] = useState(false);
  const mobileCardsStartRef = useRef<HTMLDivElement | null>(null);

  const sectionedOrderedRows = useMemo(
    () =>
      sectionedCalendarList
        ? buildTeacherDailyDutiesOrderedRows(lessons, listReferenceDate ?? new Date())
        : [],
    [lessons, sectionedCalendarList, listReferenceDate],
  );

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const platform = navigator.platform ?? '';
    const userAgent = navigator.userAgent ?? '';
    setIsIPad(
      /iPad/i.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    );
  }, []);

  const sectionedLessonsKey = useMemo(() => lessons.map((l) => l.id).join('|'), [lessons]);

  useEffect(() => {
    if (sectionedCalendarList) {
      setSectionedListPage(1);
    }
  }, [sectionedCalendarList, sectionedLessonsKey]);

  const sectionedTotalPages = Math.max(
    1,
    Math.ceil(sectionedOrderedRows.length / TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE),
  );

  useEffect(() => {
    if (sectionedCalendarList && sectionedListPage > sectionedTotalPages) {
      setSectionedListPage(sectionedTotalPages);
    }
  }, [sectionedCalendarList, sectionedListPage, sectionedTotalPages]);

  const sectionedPageRows = useMemo(() => {
    if (!sectionedCalendarList) return [];
    return sectionedOrderedRows.slice(
      (sectionedListPage - 1) * TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE,
      sectionedListPage * TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE,
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

  const sortedLessons = useMemo(
    () => sortLessonListRows(lessons, sortBy, sortOrder),
    [lessons, sortBy, sortOrder],
  );

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
      setSelectedLessons(checked ? new Set(sectionedPageLessonIds) : new Set());
      return;
    }
    setSelectedLessons(checked ? new Set(lessons.map((l) => l.id)) : new Set());
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
    }
  };

  const cardRows = useMemo<LessonListCardRow[]>(
    () =>
      sectionedCalendarList
        ? (useMobileCards
            ? sectionedOrderedRows.map((row) => ({ lesson: row.lesson, category: row.category }))
            : sectionedPageRows.map((row) => ({ lesson: row.lesson, category: row.category })))
        : sortedLessons.map((lesson) => ({ lesson })),
    [sectionedCalendarList, useMobileCards, sectionedOrderedRows, sectionedPageRows, sortedLessons],
  );

  const mobileCardPageSize = isIPad ? IPAD_CARD_PAGE_SIZE : MOBILE_CARD_PAGE_SIZE;
  const mobileCardsTotalPages = Math.max(1, Math.ceil(cardRows.length / mobileCardPageSize));
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

  const tableColSpan =
    (hideActionsColumn ? 8 : 9) +
    (sectionedCalendarList && showScheduleColumn ? 1 : 0) +
    (hideTeacherColumn ? 0 : 1);

  const allSelected = sectionedCalendarList
    ? sectionedPageLessonIds.length > 0 &&
      sectionedPageLessonIds.every((id) => selectedLessons.has(id))
    : lessons.length > 0 && selectedLessons.size === lessons.length;

  const someSelected = sectionedCalendarList
    ? sectionedPageLessonIds.some((id) => selectedLessons.has(id)) && !allSelected
    : selectedLessons.size > 0 && selectedLessons.size < lessons.length;

  const showBulkBar = Boolean(onBulkDelete && (showBulkBarWhenEmpty || selectedLessons.size > 0));
  const hasSelectedLessons = selectedLessons.size > 0;

  const handleView = (lessonId: string) => {
    navigateToLessonDetail(lessonId, router);
  };

  const goToMobileCardsPage = (nextPage: number) => {
    setMobileCardsPage(nextPage);
    requestAnimationFrame(() => {
      mobileCardsStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return {
    isTeacher,
    isIPad,
    selectedLessons,
    sectionedListPage,
    setSectionedListPage,
    sectionedOrderedRows,
    sectionedPageRows,
    scheduleCategoryLabels,
    sortedLessons,
    cardRows,
    mobilePaginatedCardRows,
    mobileCardPageSize,
    safeMobileCardsPage,
    mobileCardsStartRef,
    allSelected,
    someSelected,
    showBulkBar,
    hasSelectedLessons,
    handleSelectAll,
    handleSelectLesson,
    handleBulkDelete,
    handleView,
    goToMobileCardsPage,
    tableColSpan,
  };
}
