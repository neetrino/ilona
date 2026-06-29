import { RefObject } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Badge } from '@/shared/components/ui/badge';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { CalendarListActionPill } from '@/shared/components/calendar/CalendarListActionPill';
import { getLessonActionsDerived, type LessonActionId } from '@/shared/lib/calendar/lesson-action-states';
import { teacherCalendarRowSection } from '@/shared/lib/calendar/teacher-calendar-list-order';
import type { LessonListCardRow } from './lesson-list-table.types';
import { OBLIGATION_IDS } from './lesson-list-table.constants';

interface LessonListTableMobileCardsProps {
  isIPad: boolean;
  useMobileCards: boolean;
  cardRows: LessonListCardRow[];
  mobilePaginatedCardRows: LessonListCardRow[];
  mobileCardPageSize: number;
  safeMobileCardsPage: number;
  mobileCardsTotalPages: number;
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
  mobileCardsTotalPages,
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
  const tCal = useTranslations('calendar');
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
        const section = row.category ? teacherCalendarRowSection(row.category) : null;
        const globalRowIndex = (safeMobileCardsPage - 1) * mobileCardPageSize + idx;
        const prevGlobalRow = globalRowIndex > 0 ? cardRows[globalRowIndex - 1] : null;
        const prevSection = prevGlobalRow?.category
          ? teacherCalendarRowSection(prevGlobalRow.category)
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
                      onCheckedChange={(checked) => onSelectLesson(lesson.id, checked === true)}
                      className="relative -top-[1px] h-5 w-5 rounded-md"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[1.2rem] leading-tight font-semibold whitespace-normal break-words text-[#111827]">
                      {lesson.group?.name || tCal('unknownGroupName')}
                    </p>
                    {lesson.completionStatus === 'DONE' ? (
                      <div className="mt-1">
                        <Badge variant="success" className="border-green-200 bg-green-100 text-green-700">
                          {tCal('completed')}
                        </Badge>
                      </div>
                    ) : lesson.completionStatus === 'IN_PROCESS' ? (
                      <div className="mt-1">
                        <Badge variant="warning" className="border-yellow-200 bg-yellow-100 text-yellow-700">
                          {tCal('statusInProcess')}
                        </Badge>
                      </div>
                    ) : null}
                    <div className="mt-5 -ml-[31px] grid grid-cols-2 items-stretch gap-3">
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
                            {new Date(lesson.scheduledAt).toLocaleDateString(
                              locale === 'hy' ? 'hy-AM' : 'en-GB',
                              { weekday: 'short', month: 'short', day: 'numeric' },
                            )}
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
                <div
                  className="grid grid-cols-3 gap-2"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  {OBLIGATION_IDS.map((id) => (
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
      {cardRows.length > mobileCardPageSize && (
        <div
          className={cn(
            'flex items-center justify-between px-1 text-sm text-[#8b8b90]',
            isIPad && 'col-span-2',
          )}
        >
          <span>
            {(safeMobileCardsPage - 1) * mobileCardPageSize + 1}-
            {Math.min(safeMobileCardsPage * mobileCardPageSize, cardRows.length)} / {cardRows.length}
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
              onClick={() => onGoToPage(Math.max(1, safeMobileCardsPage - 1))}
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
              onClick={() => onGoToPage(Math.min(mobileCardsTotalPages, safeMobileCardsPage + 1))}
              aria-label={tCal('paginationNext')}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
