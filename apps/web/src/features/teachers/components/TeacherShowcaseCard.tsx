'use client';

import { useEffect, useState, type ReactNode, type KeyboardEvent } from 'react';
import { Avatar } from '@/shared/components/ui';
import { Award } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import type { Teacher } from '../types';
import { getExperienceLabelFromHireDate } from '../utils/experience';

export type TeacherShowcaseCardProps = {
  teacher: Teacher;
  /** Click on card body (excluding photo and header actions). */
  onCardClick?: () => void;
  /** Click on photo only — when set with onCardClick, photo opens details and body opens edit. */
  onPhotoClick?: () => void;
  /** Admin actions — shown in a toolbar above the photo (not on the image) */
  headerActions?: ReactNode;
  /** Rendered below the experience pill (admin-only metadata, etc.) */
  afterExperience?: ReactNode;
  /** Visually soften card for inactive accounts */
  isMuted?: boolean;
  /** Match student dashboard card styling */
  variant?: 'default' | 'student';
  /** Diagonal corner ribbon for the student's assigned teachers */
  myTeacherLabel?: string;
};

function getTeacherName(teacher: Teacher): string {
  const { firstName, lastName } = teacher.user;
  return `${firstName} ${lastName}`.trim();
}

export function TeacherShowcaseCard({
  teacher,
  onCardClick,
  onPhotoClick,
  headerActions,
  afterExperience,
  isMuted = false,
  variant = 'default',
  myTeacherLabel,
}: TeacherShowcaseCardProps) {
  const isStudent = variant === 'student';
  const fullName = getTeacherName(teacher);
  const experienceLabel = getExperienceLabelFromHireDate(teacher.hireDate);
  const hasCardAction = Boolean(onCardClick);
  const hasPhotoAction = Boolean(onPhotoClick);
  const interactive = hasCardAction || hasPhotoAction;
  const photoOpensDetails = hasPhotoAction;
  const articleIsButton = hasCardAction && !hasPhotoAction;
  const isIPad = useIsIPad();
  const [isIPadPro, setIsIPadPro] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !isIPad) {
      setIsIPadPro(false);
      return;
    }

    const detectIPadPro = () => {
      const maxViewportSide = Math.max(window.innerWidth, window.innerHeight);
      setIsIPadPro(maxViewportSide >= 1366);
    };

    detectIPadPro();
    window.addEventListener('resize', detectIPadPro);
    return () => window.removeEventListener('resize', detectIPadPro);
  }, [isIPad]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!hasCardAction) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onCardClick?.();
    }
  };

  const handlePhotoKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasPhotoAction) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPhotoClick?.();
    }
  };

  return (
    <article
      role={articleIsButton ? 'button' : undefined}
      tabIndex={articleIsButton ? 0 : undefined}
      onClick={hasCardAction ? onCardClick : undefined}
      onKeyDown={articleIsButton ? handleKeyDown : undefined}
      className={cn(
        'group relative bg-white p-4 transition-all duration-300 sm:flex sm:h-full sm:flex-col md:p-5',
        // Keep overflow visible when badge is shown so the ribbon text is not clipped.
        myTeacherLabel ? 'overflow-visible' : 'overflow-hidden',
        isStudent
          ? 'rounded-[1.75rem] border border-[rgba(14,14,16,0.07)] md:rounded-3xl'
          : 'rounded-2xl border border-slate-100 shadow-sm sm:rounded-[1.75rem] sm:border-slate-200 md:rounded-3xl',
        interactive &&
          (isStudent
            ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:outline-none focus-visible:ring-0'
            : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:outline-none focus-visible:ring-0'),
        isMuted && 'opacity-90',
      )}
    >
      {myTeacherLabel ? (
        <>
          <div
            className={cn(
              'pointer-events-none absolute left-0 top-0 z-30 h-[7rem] w-[7rem] overflow-hidden',
              isStudent ? 'rounded-tl-[1.75rem] md:rounded-tl-3xl' : 'rounded-tl-2xl sm:rounded-tl-[1.75rem] md:rounded-tl-3xl',
            )}
            aria-hidden="true"
          >
            <span
              className={cn(
                'absolute left-[-48%] top-[2.15rem] block w-[165%] py-1.5 text-center text-[0.65rem] font-bold uppercase leading-none tracking-wide text-white shadow-md sm:text-[0.7rem]',
                '-rotate-45',
                isStudent ? 'bg-[#1010a3]' : 'bg-slate-800',
              )}
            >
              {myTeacherLabel}
            </span>
          </div>
          <span className="sr-only">{myTeacherLabel}</span>
        </>
      ) : null}

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

      <div
        className={cn(
          'relative mb-4 flex w-full justify-center sm:mb-0 sm:shrink-0',
          photoOpensDetails &&
            'cursor-pointer rounded-3xl focus:outline-none focus-visible:outline-none focus-visible:ring-0',
        )}
        role={photoOpensDetails ? 'button' : undefined}
        tabIndex={photoOpensDetails ? 0 : undefined}
        onClick={
          photoOpensDetails
            ? (event) => {
                event.stopPropagation();
                onPhotoClick?.();
              }
            : undefined
        }
        onKeyDown={photoOpensDetails ? handlePhotoKeyDown : undefined}
      >
        <Avatar
          src={teacher.user.avatarUrl}
          name={fullName}
          size="xl"
          className={cn(
            'z-10 h-48 w-48 rounded-full border ring-2 ring-white shadow-sm transition-transform duration-300 lg:h-64',
            (!isIPad || isIPadPro) && 'sheet:h-64 sheet:w-full sheet:rounded-3xl',
            isStudent ? 'border-[rgba(14,14,16,0.07)] bg-[#fafafa]' : 'border-slate-100 bg-slate-50',
            interactive && 'group-hover:scale-[1.01]',
            photoOpensDetails && 'hover:scale-[1.01]',
            isMuted && 'opacity-90',
          )}
          alt={fullName}
        />
      </div>

      <div className="min-w-0 text-center sm:flex sm:flex-1 sm:flex-col sm:items-center sm:pt-3">
        <h3
          className={cn(
            'w-full shrink-0 truncate text-[clamp(1.125rem,7vw,2rem)] font-semibold leading-tight sm:text-xl',
            isStudent ? 'text-[#1010a3]' : 'text-slate-900',
            isMuted && (isStudent ? 'text-[#8b8b90]' : 'text-slate-600'),
          )}
        >
          {fullName}
        </h3>
        {experienceLabel ? (
          <div className="mt-2 flex w-full flex-1 items-center justify-center sm:mt-0 sm:min-h-0 sm:py-2">
            <p
              className={cn(
                'inline-flex max-w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium leading-none',
                isStudent
                  ? 'border-[rgba(14,14,16,0.07)] bg-[#f6f6f7] text-[#3b3b40]'
                  : 'border-slate-200 bg-slate-50 text-slate-600',
              )}
            >
              <Award
                className={cn(
                  'h-[1em] w-[1em] shrink-0',
                  isStudent ? 'text-[#1010a3]' : 'text-slate-500',
                )}
                aria-hidden="true"
              />
              <span className="truncate">{experienceLabel}</span>
            </p>
          </div>
        ) : null}
      </div>

      {afterExperience ? (
        <div
          className={cn(
            'mt-4 border-t pt-4 text-left sm:mt-0 sm:shrink-0',
            isStudent ? 'border-[rgba(14,14,16,0.07)]' : 'border-slate-100',
          )}
        >
          {afterExperience}
        </div>
      ) : null}
    </article>
  );
}
