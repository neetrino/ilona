'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { studentCardClass } from './tokens';
import { StudentPrimaryButton } from './StudentButtons';

type StateProps = {
  title?: string;
  message?: string;
  className?: string;
  children?: ReactNode;
};

export function StudentLoadingState({ message, className }: { message?: string; className?: string }) {
  return (
    <div
      className={cn(
        studentCardClass,
        'flex flex-col items-center justify-center py-14 text-center',
        className,
      )}
    >
      <LoadingSpinner size="md" />
      {message ? <p className="mt-4 text-sm text-[#8b8b90]">{message}</p> : null}
    </div>
  );
}

export function StudentEmptyState({ title, message, className, children }: StateProps) {
  return (
    <div
      className={cn(
        studentCardClass,
        'flex flex-col items-center justify-center py-12 text-center sm:py-14',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f6f7]">
        <svg
          className="h-7 w-7 text-[#8b8b90]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      {title ? (
        <h3 className="text-base font-semibold tracking-tight text-[#1010a3]">{title}</h3>
      ) : null}
      {message ? <p className="mt-1 max-w-sm text-sm text-[#8b8b90]">{message}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function StudentErrorState({
  title,
  message,
  className,
  onRetry,
  retryLabel = 'Retry',
}: StateProps & { onRetry?: () => void; retryLabel?: string }) {
  return (
    <div
      className={cn(
        studentCardClass,
        'flex flex-col items-center justify-center py-10 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffe8e8]">
        <svg
          className="h-7 w-7 text-[#c62828]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      {title ? (
        <h3 className="text-base font-semibold text-[#1010a3]">{title}</h3>
      ) : null}
      {message ? <p className="mt-1 max-w-md text-sm text-[#8b8b90]">{message}</p> : null}
      {onRetry ? (
        <StudentPrimaryButton type="button" onClick={onRetry} className="mt-4">
          {retryLabel}
        </StudentPrimaryButton>
      ) : null}
    </div>
  );
}

type StudentAlertVariant = 'info' | 'success' | 'warning' | 'danger';

const alertStyles: Record<StudentAlertVariant, string> = {
  info: 'border-[#ddecff] bg-[#f0f4ff] text-[#1010a3]',
  success: 'border-[#c8ebd4] bg-[#e7f6ec] text-[#0a7a3e]',
  warning: 'border-[#ffe4a8] bg-[#fff8e6] text-[#8b4a00]',
  danger: 'border-[#ffc9c9] bg-[#fff0f0] text-[#b42318]',
};

export function StudentAlert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: StudentAlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border p-4 sm:p-5',
        alertStyles[variant],
        className,
      )}
      role="status"
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={cn('text-sm', title && 'mt-1')}>{children}</div>
    </div>
  );
}

export function StudentCountChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-[rgba(14,14,16,0.07)] bg-[#ffeb8c] px-3 py-1.5 text-sm font-medium text-[#3a2f00]',
        className,
      )}
    >
      {children}
    </span>
  );
}
