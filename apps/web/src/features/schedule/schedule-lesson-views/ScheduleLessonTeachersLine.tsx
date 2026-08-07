'use client';

import { cn } from '@/shared/lib/utils';
import { studentScheduleTable } from '@/features/student-ui/tokens';
import type { Lesson } from '@/features/lessons';
import {
  formatScheduleLessonTeachersTitle,
  getScheduleLessonTeacherChips,
} from './schedule-lesson-views.util';
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
  const chips = getScheduleLessonTeacherChips(lesson);
  const isStudent = uiVariant === 'student';
  const title = formatScheduleLessonTeachersTitle(chips);

  if (chips.length === 1) {
    return (
      <div
        className={cn(
          'truncate',
          isStudent ? studentScheduleTable.lessonSub : 'text-slate-600',
          className,
        )}
        title={title}
      >
        {chips[0]?.name}
      </div>
    );
  }

  return (
    <div
      className={cn('truncate', className)}
      title={title}
      aria-label={title}
    >
      {chips.map((chip, index) => (
        <span key={chip.id}>
          {index > 0 ? (
            <span className={cn(isStudent ? studentScheduleTable.lessonMeta : 'text-slate-400')}>
              {' · '}
            </span>
          ) : null}
          <span
            className={cn(
              chip.isDayTeacher
                ? isStudent
                  ? cn(studentScheduleTable.lessonSub, 'font-semibold text-[#1f2937]')
                  : 'font-semibold text-slate-800'
                : isStudent
                  ? studentScheduleTable.lessonMeta
                  : 'font-normal text-slate-400',
            )}
          >
            {chip.name}
          </span>
        </span>
      ))}
    </div>
  );
}
