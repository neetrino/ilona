'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type AutoDismissToastVariant = 'success' | 'error';

interface AutoDismissToastProps {
  message: string;
  variant?: AutoDismissToastVariant;
  durationMs?: number;
  onDismiss?: () => void;
}

export function AutoDismissToast({
  message,
  variant = 'success',
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

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss?.(), 300);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-6 right-6 z-[10000] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] transition-all duration-300',
        leaving ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100',
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
          : 'border-red-200 bg-red-50 text-red-950',
      )}
    >
      <Icon
        className={cn('mt-0.5 h-5 w-5 shrink-0', isSuccess ? 'text-emerald-600' : 'text-red-600')}
        aria-hidden
      />
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
  );
}
