'use client';

import { cn } from '@/shared/lib/utils';
import type { MessageDeliveryStatus } from '../../utils/message-delivery-status';

interface MessageDeliveryTicksProps {
  status: MessageDeliveryStatus;
  sentLabel: string;
  readLabel: string;
  sendingLabel: string;
  className?: string;
}

export function MessageDeliveryTicks({
  status,
  sentLabel,
  readLabel,
  sendingLabel,
  className,
}: MessageDeliveryTicksProps) {
  if (status === 'pending') {
    return (
      <span
        className={cn('inline-flex h-3.5 w-3.5 items-center justify-center', className)}
        title={sendingLabel}
        aria-label={sendingLabel}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-70" />
      </span>
    );
  }

  const isRead = status === 'read';

  return (
    <svg
      viewBox="0 0 16 11"
      className={cn('h-3 w-4 shrink-0', isRead ? 'text-sky-500' : className)}
      fill="none"
      aria-label={isRead ? readLabel : sentLabel}
      role="img"
    >
      <title>{isRead ? readLabel : sentLabel}</title>
      <path
        d="M1.1 5.8L3.8 8.5L9.2 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {isRead ? (
        <path
          d="M5.4 6.2L7.4 8.5L13.5 1.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}
