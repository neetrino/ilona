import { cn } from '@/shared/lib/utils';

type OnlineStatusDotVariant = 'overlay' | 'inline';

interface OnlineStatusDotProps {
  isOnline: boolean;
  variant?: OnlineStatusDotVariant;
  className?: string;
  title?: string;
}

export function OnlineStatusDot({
  isOnline,
  variant = 'overlay',
  className,
  title,
}: OnlineStatusDotProps) {
  return (
    <div
      className={cn(
        'rounded-full',
        variant === 'overlay' && 'absolute bottom-0 right-0 h-3.5 w-3.5 border-2 border-white',
        variant === 'inline' && 'h-2 w-2 shrink-0',
        isOnline ? 'bg-green-500' : 'bg-slate-400',
        className,
      )}
      title={title}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    />
  );
}
