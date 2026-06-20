'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { getChatTheme, type ChatUiVariant } from '../lib/chat-theme';

type MessageNavigationControlsProps = {
  variant?: ChatUiVariant;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
};

export function MessageNavigationControls({
  variant = 'default',
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: MessageNavigationControlsProps) {
  const tChat = useTranslations('chat');
  const ui = getChatTheme(variant);
  return (
    <div
      className={cn(
        'flex items-center rounded-lg border bg-white/90 shadow-sm',
        ui.border,
      )}
    >
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={cn(
          'rounded-l-lg p-2 transition-colors',
          canGoPrevious ? cn(ui.body, ui.listHover) : cn(ui.subtle, 'cursor-not-allowed'),
        )}
        title={tChat('previousMessage')}
        aria-label={tChat('previousMessage')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <div className={cn('h-5 w-px', ui.border)} aria-hidden />
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className={cn(
          'rounded-r-lg p-2 transition-colors',
          canGoNext ? cn(ui.body, ui.listHover) : cn(ui.subtle, 'cursor-not-allowed'),
        )}
        title={tChat('nextMessage')}
        aria-label={tChat('nextMessage')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
