'use client';

import type { ReactNode, KeyboardEvent } from 'react';
import { Avatar } from '@/shared/components/ui';
import { Award } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Teacher } from '../types';
import { formatExperienceLabel, getExperienceYearsFromHireDate } from '../utils/experience';

export type TeacherShowcaseCardProps = {
  teacher: Teacher;
  onCardClick?: () => void;
  /** Admin actions — shown in a toolbar above the photo (not on the image) */
  headerActions?: ReactNode;
  /** Rendered below the experience pill (admin-only metadata, etc.) */
  afterExperience?: ReactNode;
  /** Visually soften card for inactive accounts */
  isMuted?: boolean;
};

function getTeacherName(teacher: Teacher): string {
  const { firstName, lastName } = teacher.user;
  return `${firstName} ${lastName}`.trim();
}

export function TeacherShowcaseCard({
  teacher,
  onCardClick,
  headerActions,
  afterExperience,
  isMuted = false,
}: TeacherShowcaseCardProps) {
  const fullName = getTeacherName(teacher);
  const experienceLabel = formatExperienceLabel(
    getExperienceYearsFromHireDate(teacher.hireDate)
  );
  const interactive = Boolean(onCardClick);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!interactive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onCardClick?.();
    }
  };

  return (
    <article
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onCardClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      className={cn(
        'group overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 md:p-5',
        interactive &&
          'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        isMuted && 'opacity-90'
      )}
    >
      {headerActions ? (
        <div
          className="mb-3 flex justify-end border-b border-slate-100 pb-3"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/95 p-0.5 shadow-sm">
            {headerActions}
          </div>
        </div>
      ) : null}

      <div className="relative mb-4 flex w-full justify-center">
        <Avatar
          src={teacher.user.avatarUrl}
          name={fullName}
          size="xl"
          className={cn(
            'z-10 h-72 w-full rounded-2xl border border-slate-100 bg-slate-50 object-contain ring-2 ring-white shadow-md transition-transform duration-300 md:h-80',
            interactive && 'group-hover:scale-[1.01]',
            isMuted && 'opacity-90'
          )}
          alt={fullName}
        />
      </div>

      <div className="min-w-0 text-center">
        <h3
          className={cn(
            'truncate text-xl font-semibold text-slate-900',
            isMuted && 'text-slate-600'
          )}
        >
          {fullName}
        </h3>
        <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 sm:text-sm">
          <Award className="h-3.5 w-3.5 shrink-0 text-slate-500 sm:h-4 sm:w-4" aria-hidden="true" />
          <span className="truncate">{experienceLabel}</span>
        </p>
      </div>

      {afterExperience ? (
        <div className="mt-4 border-t border-slate-100 pt-4 text-left">{afterExperience}</div>
      ) : null}
    </article>
  );
}
