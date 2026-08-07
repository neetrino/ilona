'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Lesson } from '@/features/lessons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';
import { cn, formatLocaleDate } from '@/shared/lib/utils';
import { ScheduleLessonCard } from './ScheduleLessonCard';
import type { ScheduleUiVariant } from './schedule-lesson-views.types';

export const SCHEDULE_CELL_MAX_VISIBLE_LESSONS = 3;

export type ScheduleDayLessonsSheetState = {
  date: Date;
  lessons: Lesson[];
} | null;

type ScheduleDayLessonsSheetProps = {
  state: ScheduleDayLessonsSheetState;
  onOpenChange: (open: boolean) => void;
  highlightPastLessonCards?: boolean;
  referenceTime?: Date;
  uiVariant?: ScheduleUiVariant;
};

export function ScheduleDayLessonsSheet({
  state,
  onOpenChange,
  highlightPastLessonCards = false,
  referenceTime = new Date(),
  uiVariant = 'default',
}: ScheduleDayLessonsSheetProps) {
  const locale = useLocale();
  const t = useTranslations('schedule');
  const isStudent = uiVariant === 'student';

  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      {state ? (
        <DialogContent
          sheet
          className="flex max-h-[min(92vh,720px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <DialogHeader
            className={cn(
              'shrink-0 border-b p-4 pb-3 sm:p-5',
              isStudent ? 'border-[rgba(14,14,16,0.07)]' : 'border-slate-100',
            )}
          >
            <DialogTitle
              className={cn(
                'pr-8 text-left text-base font-semibold sm:text-lg',
                isStudent && 'text-[#1010a3]',
              )}
            >
              {formatLocaleDate(state.date, locale, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </DialogTitle>
            <p className="mt-1 text-left text-sm text-slate-500">
              {t('dayLessonsCount', { count: state.lessons.length })}
            </p>
          </DialogHeader>
          <ul className="min-h-0 flex-1 list-none space-y-2 overflow-y-auto p-3 sm:p-4">
            {state.lessons.map((lesson) => (
              <li key={lesson.id} className="min-w-0">
                <ScheduleLessonCard
                  lesson={lesson}
                  variant="dialog"
                  highlightPastLessonCards={highlightPastLessonCards}
                  referenceTime={referenceTime}
                  uiVariant={uiVariant}
                />
              </li>
            ))}
          </ul>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

type ScheduleCellOverflowButtonProps = {
  onClick: () => void;
  isStudent?: boolean;
  ariaLabel: string;
};

/** Shown when a cell has more than {@link SCHEDULE_CELL_MAX_VISIBLE_LESSONS} lessons. */
export function ScheduleCellOverflowButton({
  onClick,
  isStudent = false,
  ariaLabel,
}: ScheduleCellOverflowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'w-full rounded border px-1.5 py-1 text-center text-[10px] font-semibold transition',
        isStudent
          ? 'border-[rgba(14,14,16,0.07)] bg-[#f6f6f7] text-[#1010a3] hover:bg-[#ddecff]/60'
          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100',
      )}
    >
      3+
    </button>
  );
}
