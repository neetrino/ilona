'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/shared/lib/utils';
import type { Chat, Message } from '../../types';
import {
  getMessageReadReceipts,
  type MessageDeliveryStatus,
} from '../../utils/message-delivery-status';
import { MessageReadReceiptsPopover } from './MessageReadReceiptsPopover';

interface MessageDeliveryTicksProps {
  status: MessageDeliveryStatus;
  sentLabel: string;
  readLabel: string;
  sendingLabel: string;
  className?: string;
  /** Admin / Manager / Teacher: open who-has-seen panel */
  canViewReceipts?: boolean;
  message?: Pick<Message, 'createdAt' | 'senderId'>;
  chat?: Chat;
}

export function MessageDeliveryTicks({
  status,
  sentLabel,
  readLabel,
  sendingLabel,
  className,
  canViewReceipts = false,
  message,
  chat,
}: MessageDeliveryTicksProps) {
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => setOpen(false), []);

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
  const label = isRead ? readLabel : sentLabel;
  const receipts =
    canViewReceipts && message && chat ? getMessageReadReceipts(message, chat) : null;

  const ticks = (
    <svg
      viewBox="0 0 16 11"
      className={cn('h-3 w-4 shrink-0', isRead ? 'text-sky-500' : className)}
      fill="none"
      aria-hidden={canViewReceipts || undefined}
      aria-label={canViewReceipts ? undefined : label}
      role={canViewReceipts ? undefined : 'img'}
    >
      {!canViewReceipts ? <title>{label}</title> : null}
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

  if (!canViewReceipts || !receipts) {
    return ticks;
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={cn(
          'inline-flex items-center rounded p-0.5 transition-colors hover:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/30',
          open && 'bg-black/[0.06]',
        )}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={label}
      >
        {ticks}
      </button>
      {open ? (
        <MessageReadReceiptsPopover
          seen={receipts.seen}
          unseen={receipts.unseen}
          onClose={handleClose}
        />
      ) : null}
    </span>
  );
}
