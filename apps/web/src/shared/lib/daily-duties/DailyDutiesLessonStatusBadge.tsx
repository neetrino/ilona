'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar } from '@/shared/components/ui/avatar';
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

/** Solid fill for tilted avatar badge — same pattern as Students "NEW". */
const TILTED_STATUS_BG: Record<DailyDutiesLessonStatus, string> = {
  DONE: 'bg-emerald-500',
  CAUTION: 'bg-red-500',
  IN_PROGRESS: 'bg-blue-500',
  WAITING: 'bg-amber-500',
};

export const dailyDutiesTiltedStatusBadgeClassName =
  'pointer-events-none absolute -left-4 -top-0.5 inline-flex -translate-y-1/2 -rotate-12 items-center rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white shadow-sm';

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

export function DailyDutiesLessonStatusTiltedBadge({
  status,
  className,
}: {
  status: DailyDutiesLessonStatus;
  className?: string;
}) {
  const t = useTranslations('dailyDuties');

  return (
    <span
      className={cn(dailyDutiesTiltedStatusBadgeClassName, TILTED_STATUS_BG[status], className)}
      aria-label={t(labelKey(status))}
    >
      {t(labelKey(status)).toUpperCase()}
    </span>
  );
}

export function DailyDutiesLessonListNameCell({ lesson }: { lesson: Lesson }) {
  const t = useTranslations('dailyDuties');
  const groupName = lesson.group?.name || t('unknownGroupName');
  const status = resolveDailyDutiesLessonStatus(lesson);

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative shrink-0">
        <Avatar name={groupName} size="md" />
        {status ? <DailyDutiesLessonStatusTiltedBadge status={status} /> : null}
      </div>
      <p className="min-w-0 font-semibold text-slate-800">{groupName}</p>
    </div>
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
