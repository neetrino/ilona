import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import {
  getSegmentedIndicatorStyle,
  SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS,
  SEGMENTED_TOGGLE_BUTTON_CLASS,
  SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
  SEGMENTED_TOGGLE_INDICATOR_CLASS,
  SEGMENTED_TOGGLE_TRACK_CLASS,
  SEGMENTED_TOGGLE_TRACK_PADDING_PX,
} from '@/shared/components/ui/segmented-toggle-theme';
import type { DailyDutiesViewMode } from './daily-duties.types';

interface DailyDutiesControlsProps {
  viewMode: DailyDutiesViewMode;
  periodHeader: string;
  /** True when the visible period includes today (Today control looks selected). */
  isTodayPeriod: boolean;
  onNavigatePeriod: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  onViewModeChange: (mode: DailyDutiesViewMode) => void;
  onAddLesson?: () => void;
}

export function DailyDutiesControls({
  viewMode,
  periodHeader,
  isTodayPeriod,
  onNavigatePeriod,
  onGoToToday,
  onViewModeChange,
  onAddLesson,
}: DailyDutiesControlsProps) {
  const t = useTranslations('dailyDuties');
  const tLessons = useTranslations('lessons');
  const locale = useLocale();

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="w-full min-w-0 space-y-2 sm:flex sm:w-auto sm:min-w-0 sm:flex-wrap sm:items-center sm:gap-4 sm:space-y-0">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:contents">
          <button
            type="button"
            onClick={() => onNavigatePeriod('prev')}
            className="rounded-[15px] p-2 hover:bg-[#f6f6f7]"
          >
            <svg className="h-5 w-5 text-[#3b3b40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-center text-lg font-semibold text-[#3b3b40] sm:text-left">{periodHeader}</h2>
          <button
            type="button"
            onClick={() => onNavigatePeriod('next')}
            className="justify-self-end rounded-[15px] p-2 hover:bg-[#f6f6f7]"
          >
            <svg className="h-5 w-5 text-[#3b3b40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={onGoToToday}
          aria-pressed={isTodayPeriod}
          className={cn(
            'h-11 min-h-11 rounded-[15px] px-3 text-sm font-medium sm:ml-0',
            isTodayPeriod
              ? 'bg-[#1010a3] text-white shadow-sm'
              : 'text-blue-600 hover:bg-blue-50',
          )}
        >
          {t('today')}
        </button>
      </div>

      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
        <div className={cn(SEGMENTED_TOGGLE_TRACK_CLASS, 'flex-1 sm:w-[276px] sm:flex-none')}>
          <span
            aria-hidden
            className={cn(SEGMENTED_TOGGLE_INDICATOR_CLASS, 'sm:hidden')}
            style={getSegmentedIndicatorStyle(
              viewMode === 'list' ? 0 : 1,
              2,
              SEGMENTED_TOGGLE_TRACK_PADDING_PX,
            )}
          />
          <span
            aria-hidden
            className={cn(SEGMENTED_TOGGLE_INDICATOR_CLASS, 'hidden sm:block')}
            style={getSegmentedIndicatorStyle(
              Math.max(0, (['list', 'week', 'month'] as const).indexOf(viewMode)),
              3,
              SEGMENTED_TOGGLE_TRACK_PADDING_PX,
            )}
          />
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={cn(
              SEGMENTED_TOGGLE_BUTTON_CLASS,
              locale === 'hy' ? 'px-3 text-xs sm:px-4 sm:text-sm' : 'px-4 text-sm',
              viewMode === 'list' ? SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS : SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
            )}
            aria-pressed={viewMode === 'list'}
          >
            {t('list')}
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('week')}
            className={cn(
              SEGMENTED_TOGGLE_BUTTON_CLASS,
              locale === 'hy' ? 'px-3 text-xs sm:px-4 sm:text-sm' : 'px-4 text-sm',
              viewMode === 'week' ? SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS : SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
            )}
            aria-pressed={viewMode === 'week'}
          >
            {t('week')}
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('month')}
            className={cn(
              SEGMENTED_TOGGLE_BUTTON_CLASS,
              'hidden px-4 text-sm sm:inline-flex',
              viewMode === 'month' ? SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS : SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
            )}
            aria-pressed={viewMode === 'month'}
          >
            {t('month')}
          </button>
        </div>
        {onAddLesson ? (
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={onAddLesson}
            className={cn(
              'h-11 min-h-11 rounded-[15px] py-0 font-semibold whitespace-nowrap shadow-sm bg-[#1010a3] text-white hover:bg-[#1010a3]/90',
              locale === 'hy' ? 'px-3 text-sm sm:px-4' : 'px-4 text-sm',
            )}
          >
            + {tLessons('addLesson')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
