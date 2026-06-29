'use client';

import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { GroupIconDisplay } from '../../group-icon-registry';
import {
  GROUP_CARD_INTERACTIVE_CLASS,
  GROUP_CARD_STUDENT_LIST_BLOCK_CLASS,
} from './group-card.constants';
import { GroupCardScheduleSlots } from './GroupCardScheduleSlots';
import { GroupCardStudentList } from './GroupCardStudentList';
import type { GroupCardLayoutProps } from './group-card.types';

export function GroupCardDesktop({
  group,
  onStudentClick,
  teachersDisplay,
  scheduleSummary,
  occupancy,
  dotColorClass,
  handleCardActivate,
  handleCardKeyDown,
}: GroupCardLayoutProps) {
  const students = group.students;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardActivate}
      onKeyDown={handleCardKeyDown}
      className={cn('hidden h-full min-w-0 flex-col sm:flex', GROUP_CARD_INTERACTIVE_CLASS)}
    >
      <div className="mb-3 shrink-0">
        <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <div className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-2 gap-y-[5px]">
              <span className="shrink-0 self-start" aria-hidden>
                <GroupIconDisplay iconKey={group.iconKey} size={20} />
              </span>
              <div className="flex min-w-0 flex-wrap items-center gap-[15px]">
                <h4 className="min-w-0 break-words text-sm font-semibold leading-snug text-slate-800">
                  {group.name}
                </h4>
                {group.level ? (
                  <Badge variant="info" className="shrink-0 px-2 py-0.5 text-xs">
                    {group.level}
                  </Badge>
                ) : null}
              </div>
              {teachersDisplay ? (
                <>
                  <Image
                    src="/teachers-logo.webp"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 shrink-0 object-contain"
                  />
                  <span className="min-w-0 truncate text-sm font-medium text-slate-600" title={teachersDisplay}>
                    {teachersDisplay}
                  </span>
                </>
              ) : null}
            </div>
            {scheduleSummary ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
                  <Clock className="h-5 w-5 text-slate-400" />
                </span>
                <GroupCardScheduleSlots slots={scheduleSummary} layout="inline" />
              </div>
            ) : null}
          </div>
        </div>
        {group.description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500" title={group.description}>
            {group.description}
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-col gap-2 text-xs">
        {students !== undefined && (
          <div className={GROUP_CARD_STUDENT_LIST_BLOCK_CLASS}>
            <GroupCardStudentList students={students} onStudentClick={onStudentClick} />
          </div>
        )}

        <div className="mt-3 flex shrink-0 items-center gap-2 text-slate-600">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${dotColorClass}`} aria-hidden="true" />
          <span className="font-medium text-slate-700">{occupancy.label}</span>
        </div>

        {!group.isActive && (
          <div className="shrink-0 pt-0.5">
            <Badge variant="warning" className="px-2 py-0.5 text-xs">
              Inactive
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
