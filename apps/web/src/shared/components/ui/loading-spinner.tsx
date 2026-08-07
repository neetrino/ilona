'use client';

import { cn } from '@/shared/lib/utils';

const SIZE_MAP = {
  xs: { box: 'h-3.5 w-3.5', ring: 'border-[1.5px]', glow: 'blur-[2px]' },
  sm: { box: 'h-5 w-5', ring: 'border-2', glow: 'blur-[3px]' },
  md: { box: 'h-8 w-8', ring: 'border-[2.5px]', glow: 'blur-[4px]' },
  lg: { box: 'h-12 w-12', ring: 'border-[3px]', glow: 'blur-[5px]' },
} as const;

export type LoadingSpinnerSize = keyof typeof SIZE_MAP;

export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  className?: string;
  label?: string;
}

/**
 * Brand loading indicator for Ilona portals (Admin / Teacher / Student).
 * Soft track + brand arc with a light glow — matches #1010a3 UI.
 */
export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading',
}: LoadingSpinnerProps) {
  const s = SIZE_MAP[size];

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn('relative inline-flex shrink-0 items-center justify-center', s.box, className)}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 rounded-full border-[rgba(16,16,163,0.12)]',
          s.ring,
        )}
      />
      <span
        aria-hidden
        className={cn(
          'absolute inset-[18%] rounded-full bg-[#1010a3]/15',
          s.glow,
          'animate-pulse',
        )}
      />
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 rounded-full border-transparent border-t-[#1010a3] border-r-[#1010a3]/35',
          s.ring,
          'animate-spin',
        )}
        style={{ animationDuration: size === 'lg' ? '0.85s' : '0.75s' }}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export interface PageLoadingProps {
  size?: LoadingSpinnerSize;
  className?: string;
  label?: string;
}

/** Full-viewport / section centered loading state. */
export function PageLoading({
  size = 'lg',
  className,
  label = 'Loading',
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        'flex min-h-[12rem] w-full flex-col items-center justify-center gap-3',
        className,
      )}
    >
      <LoadingSpinner size={size} label={label} />
    </div>
  );
}
