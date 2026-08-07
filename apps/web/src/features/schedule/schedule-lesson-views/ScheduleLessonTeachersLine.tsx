'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { studentScheduleTable } from '@/features/student-ui/tokens';
import type { Lesson } from '@/features/lessons';
import { getScheduleLessonTeacherChips } from './schedule-lesson-views.util';
import type { ScheduleUiVariant } from './schedule-lesson-views.types';

type ScheduleLessonTeachersLineProps = {
  lesson: Lesson;
  className?: string;
  uiVariant?: ScheduleUiVariant;
};

export function ScheduleLessonTeachersLine({
  lesson,
  className,
  uiVariant = 'default',
}: ScheduleLessonTeachersLineProps) {
  const t = useTranslations('schedule');
  const chips = getScheduleLessonTeacherChips(lesson);
  const isStudent = uiVariant === 'student';

  if (chips.length === 1) {
    return (
      <div
        className={cn(
          'break-words leading-tight',
          isStudent ? studentScheduleTable.lessonSub : 'text-slate-600',
          className,
        )}
      >
        {chips[0]?.name}
      </div>
    );
  }

  const dayTeacher = chips.find((chip) => chip.isDayTeacher) ?? chips[0];
  const otherTeacher = chips.find((chip) => !chip.isDayTeacher) ?? chips[1];
  const title = t('coTeachTeachersTitle', {
    dayTeacher: dayTeacher?.name ?? '',
    otherTeacher: otherTeacher?.name ?? '',
  });

  return (
    <div className={cn('flex flex-col gap-0.5 leading-tight', className)} title={title} aria-label={title}>
      <div
        className={cn(
          'inline-flex w-fit max-w-full flex-wrap items-baseline gap-x-1 rounded px-1 py-px',
          isStudent ? 'bg-[#dbeafe] text-[#1e3a8a]' : 'bg-blue-100 text-blue-900',
        )}
      >
        <span className="break-words font-semibold">{dayTeacher?.name}</span>
        <span
          className={cn(
            'shrink-0 text-[0.85em] font-bold uppercase tracking-wide',
            isStudent ? 'text-[#1d4ed8]' : 'text-blue-700',
          )}
        >
          {t('teachingTodayBadge')}
        </span>
      </div>
      {otherTeacher ? (
        <div
          className={cn(
            'break-words font-normal',
            isStudent ? studentScheduleTable.lessonMeta : 'text-slate-500',
          )}
        >
          {otherTeacher.name}
        </div>
      ) : null}
    </div>
  );
}
