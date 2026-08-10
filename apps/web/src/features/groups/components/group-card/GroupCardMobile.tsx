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

export function GroupCardMobile({
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
      className={cn(
        'flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)] sm:hidden',
        GROUP_CARD_INTERACTIVE_CLASS,
      )}
    >
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <span className="shrink-0 self-start pt-0.5" aria-hidden>
              <GroupIconDisplay iconKey={group.iconKey} size={18} />
            </span>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 break-words text-lg font-semibold leading-snug text-[#1a1a1a]">
                {group.name}
              </p>
              {group.level ? (
                <Badge variant="info" className="shrink-0 px-2 py-0.5 text-xs">
                  {group.level}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-1.4 flex min-w-0 items-center gap-2">
          <Image
            src="/teachers-logo.webp"
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 shrink-0 object-contain"
          />
          <p
            className="min-w-0 truncate text-sm font-normal text-[#8b8b90]"
            title={teachersDisplay ?? undefined}
          >
            {teachersDisplay || 'Not assigned'}
          </p>
        </div>

        {scheduleSummary ? (
          <div className="mt-3.5 flex min-w-0 items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
              <Clock className="h-5 w-5 text-[#8b8b90]" />
            </span>
            <GroupCardScheduleSlots slots={scheduleSummary} layout="paired" />
          </div>
        ) : null}
      </div>

      <div className="mx-4 border-t border-[rgba(14,14,16,0.07)]" />

      {students !== undefined ? (
        <div className={cn('px-4 py-3', GROUP_CARD_STUDENT_LIST_BLOCK_CLASS)}>
          <GroupCardStudentList
            students={students}
            onStudentClick={onStudentClick}
            layout="double"
            numberClassName="font-normal text-[#8b8b90]"
          />
        </div>
      ) : (
        <div className="min-h-[4rem] flex-1" aria-hidden />
      )}

      <div className="px-4 pb-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${dotColorClass}`} aria-hidden="true" />
          <span className="text-sm font-normal text-[#3b3b40]">{occupancy.label}</span>
        </div>
      </div>
    </div>
  );
}
