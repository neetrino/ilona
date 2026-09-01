'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, CheckCircle2, XCircle, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type AutoDismissToastVariant = 'success' | 'error';
export type AutoDismissToastPosition = 'bottom-right' | 'center';

interface AutoDismissToastProps {
  message: string;
  variant?: AutoDismissToastVariant;
  position?: AutoDismissToastPosition;
  durationMs?: number;
  onDismiss?: () => void;
}

export function AutoDismissToast({
  message,
  variant = 'success',
  position = 'bottom-right',
  durationMs = 3500,
  onDismiss,
}: AutoDismissToastProps) {
  const t = useTranslations('common');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setLeaving(true), Math.max(0, durationMs - 320));
    const dismissTimer = setTimeout(() => onDismiss?.(), durationMs);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [durationMs, onDismiss]);

  const isSuccess = variant === 'success';
  const isCentered = position === 'center';

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss?.(), 300);
  };

  if (isCentered) {
    return (
      <div className="pointer-events-none fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div
          className={cn(
            'absolute inset-0 bg-[#0e0e10]/25 transition-opacity duration-300 pointer-events-auto',
            leaving ? 'opacity-0' : 'opacity-100',
          )}
          onClick={dismiss}
          aria-hidden
        />
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'relative z-10 pointer-events-auto w-full max-w-[360px] overflow-hidden rounded-[22px] border bg-white shadow-[0_24px_60px_rgba(16,16,163,0.16)] transition-all duration-300',
            leaving ? 'translate-y-2 scale-95 opacity-0' : 'translate-y-0 scale-100 opacity-100',
            isSuccess
              ? 'border-[rgba(16,16,163,0.10)]'
              : 'border-red-100',
          )}
        >
          <div
            className={cn(
              'h-1 w-full',
              isSuccess
                ? 'bg-gradient-to-r from-[#1010a3] via-[#3b5bdb] to-[#1010a3]'
                : 'bg-gradient-to-r from-red-500 via-red-400 to-red-500',
            )}
          />
          <div className="relative px-6 pb-6 pt-5">
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-[#8b8b90] transition-colors hover:bg-[#f5f6ff] hover:text-[#3b3b40]"
              aria-label={t('dismissNotification')}
            >
              <X className="size-4" aria-hidden />
            </button>

            <div className="flex flex-col items-center text-center">
              <span
                className={cn(
                  'mb-4 flex size-14 items-center justify-center rounded-2xl shadow-sm',
                  isSuccess
                    ? 'bg-gradient-to-br from-[#1010a3] to-[#2a2ac0] text-white'
                    : 'bg-gradient-to-br from-red-500 to-red-600 text-white',
                )}
              >
                {isSuccess ? (
                  <Check className="size-7" strokeWidth={2.5} aria-hidden />
                ) : (
                  <XCircle className="size-7" strokeWidth={2} aria-hidden />
                )}
              </span>
              <p className="max-w-[280px] text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#3b3b40]">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[10000]">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] transition-all duration-300',
          leaving ? 'translate-y-1 scale-95 opacity-0' : 'translate-y-0 scale-100 opacity-100',
          isSuccess
            ? 'border-emerald-200/80 bg-white text-emerald-950'
            : 'border-red-200/80 bg-white text-red-950',
        )}
      >
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            isSuccess ? 'bg-emerald-100' : 'bg-red-100',
          )}
        >
          <Icon
            className={cn('h-4 w-4', isSuccess ? 'text-emerald-600' : 'text-red-600')}
            aria-hidden
          />
        </span>
        <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-0.5 text-current/50 transition-colors hover:text-current"
          aria-label={t('dismissNotification')}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
