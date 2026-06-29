'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Lesson } from '@/features/lessons';
import { WeekLessonGrid, MonthLessonGrid } from '@/features/schedule/ScheduleLessonViews';
import { scheduleDateKeyFromIso, type ScheduleViewMode } from '@/features/schedule/schedule-dates';
import type { ReactNode } from 'react';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { ListBoardViewToggle, SegmentedControl } from '@/shared/components/ui';
import { ADMIN_CONTROL_CLASS } from '@/shared/lib/admin-control-theme';
import { cn } from '@/shared/lib/utils';

function capitalizeLabel(value: string, locale: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toLocaleUpperCase(locale) + trimmed.slice(1);
}

function buildLessonsByDate(lessons: Lesson[]): Record<string, Lesson[]> {
  return lessons.reduce<Record<string, Lesson[]>>((acc, lesson) => {
    const key = scheduleDateKeyFromIso(lesson.scheduledAt);
    if (!key) {
      return acc;
    }
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(lesson);
    return acc;
  }, {});
}

export type ScheduleBoardProps = {
  lessons: Lesson[];
  isLoading: boolean;
  topBar: ReactNode;
  headerCenterContent?: ReactNode;
  managerBranchName?: string | null;
  weekDates: Date[];
  monthDates: (Date | null)[][];
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  periodLabel: string;
  onPeriodNavigate: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  /** Past vs future lesson starts (local instant): green vs blue; status accents unchanged. */
  highlightPastLessonCards?: boolean;
  /** Student portal styling aligned with dashboard. */
  variant?: 'default' | 'student';
  /** Hide month toggle on mobile screens only. */
  hideMonthOnMobile?: boolean;
};

export function ScheduleBoard({
  lessons,
  isLoading,
  topBar,
  headerCenterContent,
  managerBranchName = null,
  weekDates,
  monthDates,
  viewMode,
  onViewModeChange,
  periodLabel,
  onPeriodNavigate,
  onGoToToday,
  highlightPastLessonCards = false,
  variant = 'default',
  hideMonthOnMobile = false,
}: ScheduleBoardProps) {
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isStudent = variant === 'student';
  const isIPad = useIsIPad();
  const [isIPadMini, setIsIPadMini] = useState(false);
  const isIPadAirLayout = isIPad && !isIPadMini;
  const lessonsByDate = useMemo(
    () => buildLessonsByDate(lessons),
    [lessons],
  );
  const headerCenterContentClass = isIPadMini
    ? 'order-none ml-auto w-[14.5rem] shrink-0 [&>*]:w-full [&>*]:md:w-full'
    : isIPadAirLayout
      ? 'order-last w-full md:mt-3 md:flex md:justify-end md:[&>*]:w-[20rem]'
      : 'order-last w-full md:pointer-events-auto md:absolute md:left-1/2 md:top-1/2 md:z-10 md:w-[min(20rem,calc(100%-24rem))] md:-translate-x-1/2 md:-translate-y-1/2';
  const mobileToggleVisibilityClass =
    hideMonthOnMobile
      ? isIPadMini
        ? 'hidden min-[769px]:inline-flex '
        : 'hidden sm:inline-flex '
      : '';
  const studentBoardSizeClass = isIPad
    ? 'flex w-full min-w-0 flex-col rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white'
    : 'flex w-full min-w-0 flex-col rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white';
  const defaultBoardSizeClass =
    'flex w-full min-w-0 flex-col overflow-visible rounded-xl border border-slate-200 bg-white';

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const platform = navigator.platform ?? '';
    const userAgent = navigator.userAgent ?? '';
    const isIPadDevice =
      /iPad/i.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const shortestScreenSide = Math.min(window.screen.width, window.screen.height);

    setIsIPadMini(isIPadDevice && shortestScreenSide <= 768);
  }, []);

  return (
    <>
      {topBar}
      <div
        className={
          isStudent
            ? studentBoardSizeClass
            : defaultBoardSizeClass
        }
      >
        <div
          className={
            isStudent
              ? `relative flex flex-col gap-3 border-b border-[rgba(14,14,16,0.07)] p-4 md:flex-row md:items-center md:justify-between${
                  isIPadAirLayout ? ' md:flex-wrap' : ''
                }`
              : `relative flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between${
                  isIPadAirLayout ? ' md:flex-wrap' : ''
                }`
          }
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPeriodNavigate('prev')}
              className={
                isStudent
                  ? 'flex h-9 w-9 items-center justify-center rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] text-[#3b3b40] hover:bg-[#f6f6f7]'
                  : 'flex h-11 w-11 items-center justify-center rounded-[15px] border border-slate-200 text-slate-600 hover:bg-slate-50'
              }
              aria-label={tCommon('previousPeriod')}
            >
              ←
            </button>
            <div
              className={
                isStudent
                  ? 'min-w-0 flex-1 text-center text-sm font-semibold tracking-tight text-[#1010a3] sm:min-w-[10rem] sm:flex-none'
                  : 'min-w-0 flex-1 text-center text-sm font-semibold text-slate-800 sm:min-w-[10rem] sm:flex-none'
              }
            >
              {periodLabel}
            </div>
            <button
              type="button"
              onClick={() => onPeriodNavigate('next')}
              className={
                isStudent
                  ? 'flex h-9 w-9 items-center justify-center rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] text-[#3b3b40] hover:bg-[#f6f6f7]'
                  : 'flex h-11 w-11 items-center justify-center rounded-[15px] border border-slate-200 text-slate-600 hover:bg-slate-50'
              }
              aria-label={tCommon('nextPeriod')}
            >
              →
            </button>
            <button
              type="button"
              onClick={onGoToToday}
              className={
                isStudent
                  ? 'ml-2 h-9 rounded-full border border-[rgba(14,14,16,0.07)] px-3 text-sm font-medium text-[#1010a3] hover:bg-[#f6f6f7]'
                  : 'ml-2 h-11 rounded-[15px] border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50'
              }
            >
              {tCommon('today')}
            </button>
          </div>

          {headerCenterContent ? (
            <div className={headerCenterContentClass}>
              {headerCenterContent}
            </div>
          ) : managerBranchName ? (
            <div className="flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2">
              <span
                className={
                  isStudent
                    ? 'inline-flex h-9 items-center rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f6f6f7] px-3 text-sm font-medium whitespace-nowrap text-[#3b3b40]'
                    : 'inline-flex h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-base font-medium whitespace-nowrap text-slate-600'
                }
              >
                {managerBranchName}
              </span>
            </div>
          ) : null}

          {!isStudent ? (
            <div className={mobileToggleVisibilityClass}>
              <ListBoardViewToggle
                value={viewMode === 'week' ? 'list' : 'board'}
                onChange={(mode) => onViewModeChange(mode === 'list' ? 'week' : 'month')}
                listLabel="Week"
                boardLabel="Month"
                className={cn(ADMIN_CONTROL_CLASS, 'self-start md:self-auto')}
              />
            </div>
          ) : (
            <SegmentedControl
              options={[
                { id: 'week', label: capitalizeLabel(tCommon('week'), locale) },
                { id: 'month', label: capitalizeLabel(tCommon('month'), locale) },
              ]}
              value={viewMode}
              onChange={(mode) => onViewModeChange(mode as ScheduleViewMode)}
              className={cn(
                'w-full sm:w-[184px] self-start md:self-auto',
                hideMonthOnMobile && '[&>button:last-child]:hidden sm:[&>button:last-child]:grid',
              )}
              aria-label={tCommon('viewMode')}
            />
          )}
        </div>

        <div>
          {viewMode === 'week' ? (
            <WeekLessonGrid
              weekDates={weekDates}
              lessons={lessons}
              isLoading={isLoading}
              highlightPastLessonCards={highlightPastLessonCards}
              theme={isStudent ? 'student' : 'default'}
              forceMobileLayout={isIPadMini}
            />
          ) : (
            <MonthLessonGrid
              monthDates={monthDates}
              lessonsByDate={lessonsByDate}
              isLoading={isLoading}
              highlightPastLessonCards={highlightPastLessonCards}
              theme={isStudent ? 'student' : 'default'}
            />
          )}
        </div>
      </div>
    </>
  );
}

