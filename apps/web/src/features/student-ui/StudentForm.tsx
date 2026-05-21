'use client';

import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';
import { studentLabelClass, studentInputClass, studentSelectClass } from './tokens';

export function StudentFieldLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn(studentLabelClass, className)}>
      {children}
    </label>
  );
}

export function StudentInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(studentInputClass, className)} {...props} />;
}

export function StudentSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(studentSelectClass, className)} {...props}>
      {children}
    </select>
  );
}

export function StudentFilterGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:items-end',
        className,
      )}
    >
      {children}
    </div>
  );
}
