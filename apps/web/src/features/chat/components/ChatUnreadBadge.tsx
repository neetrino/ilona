'use client';

import { cn } from '@/shared/lib/utils';

interface ChatUnreadBadgeProps {
  count: number;
  className?: string;
  /** Optional accessible label, e.g. "3 new" */
  label?: string;
}

/** Shared unread count pill — same blue style for every role. */
export function ChatUnreadBadge({ count, className, label }: ChatUnreadBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-[1.25rem] flex-shrink-0 items-center justify-center rounded-full bg-[#1010a3] px-1.5 text-xs font-medium text-white',
        className,
      )}
      aria-label={label}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
