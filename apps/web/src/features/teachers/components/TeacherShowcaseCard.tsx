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
  /** Match student dashboard card styling */
  variant?: 'default' | 'student';
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
  variant = 'default',
}: TeacherShowcaseCardProps) {
  const isStudent = variant === 'student';
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
        'group overflow-hidden rounded-[1.75rem] border bg-white p-4 transition-all duration-300 md:rounded-3xl md:p-5',
        isStudent
          ? 'border-[rgba(14,14,16,0.07)]'
          : 'border-slate-200 shadow-sm',
        interactive &&
          (isStudent
            ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/30'
            : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'),
        isMuted && 'opacity-90',
      )}
    >
      {headerActions ? (
        <div
          className={cn(
            'mb-3 flex justify-end border-b px-1 pb-3',
            isStudent ? 'border-[rgba(14,14,16,0.07)]' : 'border-slate-100',
          )}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div
            className={cn(
              'rounded-full border px-2 py-1 shadow-sm',
              isStudent
                ? 'border-[rgba(14,14,16,0.07)] bg-[#fafafa]'
                : 'border-slate-200/90 bg-slate-50/95',
            )}
          >
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
            'z-10 h-48 w-48 rounded-full border ring-2 ring-white shadow-sm transition-transform duration-300 sm:h-64 sm:w-full sm:rounded-3xl md:h-80',
            isStudent ? 'border-[rgba(14,14,16,0.07)] bg-[#fafafa]' : 'border-slate-100 bg-slate-50',
            interactive && 'group-hover:scale-[1.01]',
            isMuted && 'opacity-90',
          )}
          alt={fullName}
        />
      </div>

      <div className="min-w-0 text-center">
        <h3
          className={cn(
            'truncate text-[clamp(1.125rem,7vw,2rem)] font-semibold leading-tight sm:text-xl',
            isStudent ? 'text-[#1010a3]' : 'text-slate-900',
            isMuted && (isStudent ? 'text-[#8b8b90]' : 'text-slate-600'),
          )}
        >
          {fullName}
        </h3>
        <p
          className={cn(
            'mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium sm:text-sm',
            isStudent
              ? 'border-[rgba(14,14,16,0.07)] bg-[#f6f6f7] text-[#3b3b40]'
              : 'border-slate-200 bg-slate-50 text-slate-600',
          )}
        >
          <Award
            className={cn(
              'h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4',
              isStudent ? 'text-[#1010a3]' : 'text-slate-500',
            )}
            aria-hidden="true"
          />
          <span className="truncate">{experienceLabel}</span>
        </p>
      </div>

      {afterExperience ? (
        <div
          className={cn(
            'mt-4 border-t pt-4 text-left',
            isStudent ? 'border-[rgba(14,14,16,0.07)]' : 'border-slate-100',
          )}
        >
          {afterExperience}
        </div>
      ) : null}
    </article>
  );
}
