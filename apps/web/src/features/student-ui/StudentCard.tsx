'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  studentCardClass,
  studentInnerCardClass,
  studentPageStackClass,
  studentSectionSubtitleClass,
  studentSectionTitleClass,
} from './tokens';

type StudentCardProps = {
  children: ReactNode;
  className?: string;
  /** Removes default padding (e.g. table shell). */
  noPadding?: boolean;
};

export function StudentCard({ children, className, noPadding }: StudentCardProps) {
  return (
    <section
      className={cn(studentCardClass, noPadding && 'p-0 sm:p-0', className)}
    >
      {children}
    </section>
  );
}

export function StudentInnerCard({ children, className }: StudentCardProps) {
  return <div className={cn(studentInnerCardClass, className)}>{children}</div>;
}

export function StudentPageStack({ children, className }: StudentCardProps) {
  return <div className={cn(studentPageStackClass, className)}>{children}</div>;
}

type StudentSectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export function StudentSectionHeader({
  title,
  subtitle,
  action,
  className,
}: StudentSectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className={studentSectionTitleClass}>{title}</h2>
        {subtitle ? <p className={studentSectionSubtitleClass}>{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
