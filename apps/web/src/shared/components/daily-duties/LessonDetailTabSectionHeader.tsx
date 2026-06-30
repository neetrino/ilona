'use client';

import type { ReactNode } from 'react';
import { lessonDetailTabHeaderClass } from '@/shared/components/daily-duties/lesson-detail-tab-layout';
import { cn } from '@/shared/lib/utils';

interface LessonDetailTabSectionHeaderProps {
  title: string;
  embeddedInSheet?: boolean;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function LessonDetailTabSectionHeader({
  title,
  embeddedInSheet = false,
  subtitle,
  actions,
}: LessonDetailTabSectionHeaderProps) {
  return (
    <div
      className={cn(
        lessonDetailTabHeaderClass(embeddedInSheet),
        actions
          ? 'flex flex-row items-center justify-between gap-3'
          : 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
      )}
    >
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
