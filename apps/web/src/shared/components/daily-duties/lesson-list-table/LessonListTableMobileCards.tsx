import { RefObject } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  DailyDutiesLessonStatusTiltedBadge,
  resolveDailyDutiesLessonStatus,
} from '@/shared/lib/daily-duties/DailyDutiesLessonStatusBadge';
import { Avatar } from '@/shared/components/ui/avatar';
import { AdminListPagination } from '@/shared/components/ui';
import { User } from 'lucide-react';
import Image from 'next/image';
import { formatAppDate, formatAppTimeRange } from '@/shared/lib/app-timezone';
import { cn } from '@/shared/lib/utils';
import { DailyDutiesListActionPill } from '@/shared/components/daily-duties/DailyDutiesListActionPill';
import { getLessonActionsDerived, type LessonActionId } from '@/shared/lib/daily-duties/lesson-action-states';
import { teacherDailyDutiesRowSection } from '@/shared/lib/daily-duties/teacher-daily-duties-list-order';
import type { LessonListCardRow } from './lesson-list-table.types';
import { OBLIGATION_IDS } from './lesson-list-table.constants';

interface LessonListTableMobileCardsProps {
  isIPad: boolean;
  useMobileCards: boolean;
  cardRows: LessonListCardRow[];
  mobilePaginatedCardRows: LessonListCardRow[];
  mobileCardPageSize: number;
  safeMobileCardsPage: number;
  mobileCardsStartRef: RefObject<HTMLDivElement | null>;
  sectionedCalendarList: boolean;
  selectedLessons: Set<string>;
  isTeacher: boolean;
  mobileCardOpensSheet: boolean;
  onSelectLesson: (lessonId: string, checked: boolean) => void;
  onMobileCardClick?: (lessonId: string, tab?: LessonActionId) => void;
  onObligationClick?: (
    lessonId: string,
    obligation: 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan',
  ) => void;
  onAssignSubstitute?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onView: (lessonId: string) => void;
  onGoToPage: (page: number) => void;
}

export function LessonListTableMobileCards({
  isIPad,
  useMobileCards,
  cardRows,
  mobilePaginatedCardRows,
  mobileCardPageSize,
  safeMobileCardsPage,
  mobileCardsStartRef,
  sectionedCalendarList,
  selectedLessons,
  isTeacher,
  mobileCardOpensSheet,
  onSelectLesson,
  onMobileCardClick,
  onObligationClick,
  onAssignSubstitute,
  onDelete,
  onView,
  onGoToPage,
}: LessonListTableMobileCardsProps) {
  const locale = useLocale();
  const tCal = useTranslations('dailyDuties');
  const tCommon = useTranslations('common');

  return (
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
        const section = row.category ? teacherDailyDutiesRowSection(row.category) : null;
        const lessonStatus = resolveDailyDutiesLessonStatus(lesson);
        const groupName = lesson.group?.name || tCal('unknownGroupName');
        const globalRowIndex = (safeMobileCardsPage - 1) * mobileCardPageSize + idx;
        const prevGlobalRow = globalRowIndex > 0 ? cardRows[globalRowIndex - 1] : null;
        const prevSection = prevGlobalRow?.category
          ? teacherDailyDutiesRowSection(prevGlobalRow.category)
          : null;
        const showSectionHeader = sectionedCalendarList && section !== prevSection;

        return (
          <div key={lesson.id} className={cn(isIPad && showSectionHeader && 'contents')}>
            {showSectionHeader ? (
              <p
                className={cn(
                  'mb-2 px-1 text-xs font-bold tracking-wide text-slate-500 uppercase',
                  isIPad && 'col-span-2',
                )}
              >
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
              onClick={mobileCardOpensSheet ? () => onMobileCardClick?.(lesson.id) : undefined}
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
                'overflow-hidden rounded-[15px] border border-[rgba(14,14,16,0.09)] bg-white shadow-[0_1px_2px_rgba(14,14,16,0.03)]',
                mobileCardOpensSheet &&
                  'cursor-pointer transition-shadow hover:shadow-[0_4px_14px_rgba(14,14,16,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/25',
              )}
            >
              <div className="p-4">
                <div className="flex items-start gap-2.5">
                  <div onPointerDown={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={selectedLessons.has(lesson.id)}
                      onCheckedChange={(checked) => onSelectLesson(lesson.id, checked === true)}
                      className="relative -top-[1px] h-5 w-5 rounded-[15px]"
                    />
                  </div>
                  <div className="relative shrink-0">
                    <Avatar name={groupName} size="md" />
                    {lessonStatus ? <DailyDutiesLessonStatusTiltedBadge status={lessonStatus} /> : null}
                  </div>
                  <p className="min-w-0 flex-1 text-[1.2rem] leading-tight font-semibold break-words text-[#111827]">
                    {groupName}
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-2 items-stretch gap-3">
                      <div className="flex items-start gap-2 justify-self-start">
                        <svg
                          className="mt-0.5 h-5 w-5 shrink-0 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
                          />
                        </svg>
                        <div className="min-w-0">
                          <p className="text-left text-[11px] font-medium text-[#1f2937]">
                            {formatAppDate(lesson.scheduledAt, locale, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="mt-0.5 text-left text-[1.65rem] leading-none font-medium tabular-nums text-[#111827]">
                            {formatAppTimeRange(lesson.scheduledAt, lesson.duration)}
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
                <div className="my-3 border-t border-dashed border-[rgba(14,14,16,0.14)]" />
                <div
                  className="grid grid-cols-3 gap-2"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  {OBLIGATION_IDS.map((id) => (
                    <DailyDutiesListActionPill
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
                    onClick={() => onView(lesson.id)}
                    className="h-auto px-2 py-1 text-blue-600 hover:text-blue-700"
                  >
                    <span className="flex flex-col items-center gap-0.5">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
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
                      className={cn(
                        'h-auto px-2 py-1 text-red-600 hover:text-red-700',
                        isLocked && 'cursor-not-allowed opacity-75',
                      )}
                      title={isLocked ? tCal('lessonLockedDelete') : tCommon('delete')}
                    >
                      <span className="flex flex-col items-center gap-0.5">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
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
      <AdminListPagination
        className={cn(isIPad && 'col-span-2')}
        page={safeMobileCardsPage - 1}
        pageSize={mobileCardPageSize}
        totalItems={cardRows.length}
        onPageChange={(page) => onGoToPage(page + 1)}
        previousLabel={tCal('paginationPrevious')}
        nextLabel={tCal('paginationNext')}
      />
    </div>
  );
}
