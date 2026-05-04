'use client';

import { cn } from '@/shared/lib/utils';

type MessageNavigationControlsProps = {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
};

export function MessageNavigationControls({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: MessageNavigationControlsProps) {
  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white/90 shadow-sm">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={cn(
          'p-2 rounded-l-lg transition-colors',
          canGoPrevious
            ? 'text-slate-700 hover:bg-slate-100'
            : 'text-slate-300 cursor-not-allowed'
        )}
        title="Previous message"
        aria-label="Previous message"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <div className="w-px h-5 bg-slate-200" aria-hidden />
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className={cn(
          'p-2 rounded-r-lg transition-colors',
          canGoNext ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'
        )}
        title="Next message"
        aria-label="Next message"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
