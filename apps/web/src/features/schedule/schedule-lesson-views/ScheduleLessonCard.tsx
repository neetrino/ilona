'use client';

import { cn } from '@/shared/lib/utils';
import { studentScheduleTable } from '@/features/student-ui/tokens';
import {
  formatMinutesToLabel,
  formatScheduleTime,
  getLessonTimeBounds,
  lessonCardTone,
} from './schedule-lesson-views.util';
import { ScheduleLessonTeachersLine } from './ScheduleLessonTeachersLine';
import type { ScheduleLessonCardProps } from './schedule-lesson-views.types';

export function ScheduleLessonCard({
  lesson,
  variant = 'cell',
  highlightPastLessonCards = false,
  referenceTime,
  uiVariant = 'default',
}: ScheduleLessonCardProps) {
  const compact = variant === 'cell';
  const timeBounds = getLessonTimeBounds(lesson);
  const timeLabel = timeBounds
    ? `${formatMinutesToLabel(timeBounds.start)}-${formatMinutesToLabel(timeBounds.end)}`
    : formatScheduleTime(lesson.scheduledAt);

  return (
    <div
      className={`rounded-md border leading-snug ${lessonCardTone(lesson, { highlightPastLessonCards, referenceTime, variant: uiVariant })} ${compact ? 'px-1.5 py-1 text-[10px]' : 'px-2.5 py-2 text-sm'}`}
    >
      <div
        className={cn(
          'break-words font-semibold',
          uiVariant === 'student' ? studentScheduleTable.lessonTitle : 'text-slate-800',
        )}
      >
        {lesson.group?.name ?? 'Unknown group'}
        {lesson.group?.level ? (
          <span
            className={cn(
              'font-normal',
              uiVariant === 'student' ? studentScheduleTable.lessonMeta : 'text-slate-500',
            )}
          >
            {' '}
            · {lesson.group.level}
          </span>
        ) : null}
      </div>
      <ScheduleLessonTeachersLine lesson={lesson} uiVariant={uiVariant} />
      <div
        className={cn(
          'font-medium',
          uiVariant === 'student' ? studentScheduleTable.lessonMeta : 'text-slate-500',
        )}
      >
        {timeLabel}
      </div>
    </div>
  );
}
