'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  studentCardClass,
  studentTableHeadClass,
  studentTableRowHoverClass,
} from './tokens';

type StatTone = 'lime' | 'sky' | 'rose' | 'violet' | 'amber';

const toneIconBg: Record<StatTone, string> = {
  lime: 'bg-[#dffc76]',
  sky: 'bg-[#ddecff]',
  rose: 'bg-[#ffe1e1]',
  violet: 'bg-[#e8e8fc]',
  amber: 'bg-[#ffeb8c]',
};

export function StudentStatTile({
  label,
  value,
  icon,
  tone = 'violet',
  valueClassName,
  isLoading,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: StatTone;
  valueClassName?: string;
  isLoading?: boolean;
}) {
  return (
    <article className={studentCardClass}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-[2.625rem] w-[2.625rem] shrink-0 items-center justify-center rounded-[0.875rem]',
            toneIconBg[tone],
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-wide text-[#8b8b90]">{label}</p>
          {isLoading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded-lg bg-[#f1f1f2]" />
          ) : (
            <p
              className={cn(
                'mt-1 text-xl font-bold tracking-tight text-[#1010a3] sm:text-2xl',
                valueClassName,
              )}
            >
              {value}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export type StudentBadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'brand';

const badgeVariantClass: Record<StudentBadgeVariant, string> = {
  success: 'bg-[#e7f6ec] text-[#0a7a3e]',
  warning: 'bg-[#fff0d6] text-[#8b4a00]',
  danger: 'bg-[#ffe8e8] text-[#b42318]',
  neutral: 'bg-[#f6f6f7] text-[#3b3b40]',
  info: 'bg-[#ddecff] text-[#1010a3]',
  brand: 'bg-[#d9d9f4] text-[#1010a3]',
};

export function StudentBadge({
  children,
  variant = 'neutral',
  className,
}: {
  children: ReactNode;
  variant?: StudentBadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold',
        badgeVariantClass[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function paymentStatusVariant(status: string): StudentBadgeVariant {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'OVERDUE':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function StudentTableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 overflow-x-auto', className)}>
      <table className="w-full min-w-[36rem] text-sm">{children}</table>
    </div>
  );
}

export function StudentTableHead({ children }: { children: ReactNode }) {
  return <thead className={studentTableHeadClass}>{children}</thead>;
}

export function StudentTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[rgba(14,14,16,0.07)]">{children}</tbody>;
}

export function StudentTableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn(studentTableRowHoverClass, className)}>{children}</tr>;
}

export function StudentTh({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 font-medium', className)}>{children}</th>;
}

export function StudentTd({
  children,
  className,
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'px-4 py-3 align-top transition-colors group-hover/row:bg-[#fafafa]',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function StudentProgressRing({
  value,
  label,
  strokeColor,
}: {
  value: number;
  label: string;
  strokeColor: string;
}) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f1f2" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-[#1010a3]">{clamped}%</span>
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-medium text-[#8b8b90]">{label}</p>
    </div>
  );
}

export function StudentProgressBar({
  percent,
  barClassName = 'bg-gradient-to-r from-[#0e0e10] to-[#3b3b40]',
}: {
  percent: number;
  barClassName?: string;
}) {
  const width = `${Math.max(0, Math.min(100, percent))}%`;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f1f2]">
      <div className={cn('h-full rounded-full', barClassName)} style={{ width }} />
    </div>
  );
}
