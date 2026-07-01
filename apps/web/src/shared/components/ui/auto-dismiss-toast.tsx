'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle, X } from 'lucide-react';
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
    const fadeTimer = setTimeout(() => setLeaving(true), Math.max(0, durationMs - 300));
    const dismissTimer = setTimeout(() => onDismiss?.(), durationMs);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [durationMs, onDismiss]);

  const isSuccess = variant === 'success';
  const Icon = isSuccess ? CheckCircle2 : XCircle;
  const isCentered = position === 'center';

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss?.(), 300);
  };

  const toastCard = (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 border transition-all duration-300',
        isCentered
          ? 'max-w-md rounded-2xl px-6 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)]'
          : 'max-w-sm rounded-xl px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]',
        leaving ? 'translate-y-1 scale-95 opacity-0' : 'translate-y-0 scale-100 opacity-100',
        isSuccess
          ? 'border-emerald-200/80 bg-white text-emerald-950'
          : 'border-red-200/80 bg-white text-red-950',
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full',
          isCentered ? 'h-10 w-10' : 'h-8 w-8',
          isSuccess ? 'bg-emerald-100' : 'bg-red-100',
        )}
      >
        <Icon
          className={cn(
            isCentered ? 'h-5 w-5' : 'h-4 w-4',
            isSuccess ? 'text-emerald-600' : 'text-red-600',
          )}
          aria-hidden
        />
      </span>
      <p className={cn('flex-1 font-medium leading-snug', isCentered ? 'text-base' : 'text-sm')}>
        {message}
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-md p-0.5 text-current/50 transition-colors hover:text-current"
        aria-label={t('dismissNotification')}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );

  if (isCentered) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'absolute inset-0 bg-[#0e0e10]/20 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto',
            leaving ? 'opacity-0' : 'opacity-100',
          )}
          onClick={dismiss}
          aria-hidden
        />
        <div className="relative z-10 pointer-events-auto">{toastCard}</div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[10000] pointer-events-none">
      <div className="pointer-events-auto">{toastCard}</div>
    </div>
  );
}
