'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  StudentAnimatedPillSwitcher,
  type StudentPillOption,
} from './StudentAnimatedPillSwitcher';
import {
  studentGhostButtonClass,
  studentIconButtonClass,
  studentPrimaryButtonClass,
  studentSecondaryButtonClass,
} from './tokens';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
};

export function StudentPrimaryButton({ children, className, type = 'button', ...props }: BtnProps) {
  return (
    <button type={type} className={cn(studentPrimaryButtonClass, className)} {...props}>
      {children}
    </button>
  );
}

export function StudentSecondaryButton({ children, className, ...props }: BtnProps) {
  return (
    <button type="button" className={cn(studentSecondaryButtonClass, className)} {...props}>
      {children}
    </button>
  );
}

export function StudentGhostButton({ children, className, ...props }: BtnProps) {
  return (
    <button type="button" className={cn(studentGhostButtonClass, className)} {...props}>
      {children}
    </button>
  );
}

export function StudentIconButton({ children, className, ...props }: BtnProps) {
  return (
    <button type="button" className={cn(studentIconButtonClass, className)} {...props}>
      {children}
    </button>
  );
}

type PillOption<T extends string> = StudentPillOption<T>;

export function StudentFilterPills<T extends string>({
  options,
  value,
  onChange,
  className,
  prefix,
  shape = 'pill',
  size = 'sm',
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  prefix?: ReactNode;
  shape?: 'pill' | 'rectangular';
  size?: 'sm' | 'md' | 'segment';
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {prefix ? <span className="text-xs font-medium text-[#8b8b90]">{prefix}</span> : null}
      <StudentAnimatedPillSwitcher
        options={options}
        value={value}
        onChange={onChange}
        shape={shape}
        size={size}
      />
    </div>
  );
}

export function StudentSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <StudentAnimatedPillSwitcher
      options={options}
      value={value}
      onChange={onChange}
      size="segment"
      className={className}
    />
  );
}

export function StudentPlayButton({
  onClick,
  label = 'Play',
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(studentSecondaryButtonClass, 'pl-4 pr-1.5', className)}
    >
      {label}
      <span className="flex h-[1.8125rem] w-[1.8125rem] items-center justify-center rounded-[1.25rem] bg-[#1010a3] text-white">
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
