'use client';

import { cn } from '@/shared/lib/utils';

export function FeedbacksTabParticipationTickBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
        checked ? 'border-emerald-600 bg-emerald-500' : 'border-slate-300 bg-white',
      )}
      aria-hidden
    >
      {checked ? (
        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : null}
    </span>
  );
}
