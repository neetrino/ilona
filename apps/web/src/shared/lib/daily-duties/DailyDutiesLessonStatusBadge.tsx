'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { DailyDutiesLessonStatus } from '@ilona/types';
import type { Lesson } from '@/features/lessons';

const STATUS_STYLE: Record<
  DailyDutiesLessonStatus,
  { variant: 'success' | 'warning' | 'error' | 'info'; className: string }
> = {
  DONE: {
    variant: 'success',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  CAUTION: {
    variant: 'error',
    className: 'border-red-200 bg-red-50 text-red-800',
  },
  IN_PROGRESS: {
    variant: 'info',
    className: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  WAITING: {
    variant: 'warning',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
};

function labelKey(status: DailyDutiesLessonStatus): `lessonStatus.${string}` {
  const keys: Record<DailyDutiesLessonStatus, `lessonStatus.${string}`> = {
    DONE: 'lessonStatus.done',
    CAUTION: 'lessonStatus.caution',
    IN_PROGRESS: 'lessonStatus.inProgress',
    WAITING: 'lessonStatus.waiting',
  };
  return keys[status];
}

export function resolveDailyDutiesLessonStatus(lesson: Lesson): DailyDutiesLessonStatus | null {
  return lesson.dailyDutiesStatus ?? null;
}

export function DailyDutiesLessonStatusBadge({
  status,
  className,
}: {
  status: DailyDutiesLessonStatus;
  className?: string;
}) {
  const t = useTranslations('dailyDuties');
  const style = STATUS_STYLE[status];

  return (
    <Badge variant={style.variant} className={cn(style.className, className)}>
      {t(labelKey(status))}
    </Badge>
  );
}

export function DailyDutiesLessonStatusUnderName({ lesson }: { lesson: Lesson }) {
  const status = resolveDailyDutiesLessonStatus(lesson);
  if (!status) {
    return null;
  }

  return (
    <div className="mt-1">
      <DailyDutiesLessonStatusBadge status={status} />
    </div>
  );
}

export const DAILY_DUTIES_STATUS_FILTER_OPTIONS: DailyDutiesLessonStatus[] = [
  'DONE',
  'CAUTION',
  'IN_PROGRESS',
  'WAITING',
];
