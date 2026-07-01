import { cn } from '@/shared/lib/utils';

interface ChatBackButtonProps {
  onClick: () => void;
  className?: string;
  'aria-label'?: string;
}

export function ChatBackButton({
  onClick,
  className,
  'aria-label': ariaLabel = 'Back',
}: ChatBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1010a3] text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#1010a3]/30 focus:ring-offset-2',
        className,
      )}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
