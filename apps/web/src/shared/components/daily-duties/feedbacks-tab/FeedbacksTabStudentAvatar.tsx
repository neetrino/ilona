'use client';

import { Avatar } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/lib/utils';

interface FeedbacksTabStudentAvatarProps {
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  size?: 'list' | 'header';
  showSavedBadge?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  list: {
    avatar: 'h-11 w-11 text-sm',
    badge: 'h-4 w-4',
    badgeIcon: 'h-2.5 w-2.5',
  },
  header: {
    avatar: 'h-14 w-14 text-lg',
    badge: 'h-5 w-5',
    badgeIcon: 'h-3 w-3',
  },
} as const;

export function FeedbacksTabStudentAvatar({
  displayName,
  initials,
  avatarUrl,
  size = 'header',
  showSavedBadge = false,
  className,
}: FeedbacksTabStudentAvatarProps) {
  const config = SIZE_CONFIG[size];

  return (
    <div className={cn('relative shrink-0', className)}>
      {avatarUrl ? (
        <Avatar
          src={avatarUrl}
          name={displayName}
          size={size === 'header' ? 'lg' : 'md'}
          className={cn(config.avatar, 'shadow-md')}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 font-bold text-white shadow-md',
            config.avatar,
            size === 'header' ? 'text-lg' : 'font-semibold',
          )}
        >
          {initials}
        </div>
      )}
      {showSavedBadge ? (
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full border-2 border-white bg-emerald-500',
            config.badge,
          )}
          aria-hidden
        >
          <svg
            className={cn('text-white', config.badgeIcon)}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      ) : null}
    </div>
  );
}
