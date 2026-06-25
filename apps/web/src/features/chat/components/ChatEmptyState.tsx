import { cn } from '@/shared/lib/utils';

interface ChatEmptyStateProps {
  title: string;
  description: string;
  className?: string;
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

export function ChatEmptyState({ title, description, className }: ChatEmptyStateProps) {
  return (
    <div className={cn('flex flex-1 items-center justify-center px-6 py-8', className)}>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f6f7]">
          <ChatBubbleIcon className="h-8 w-8 text-[#8b8b90]" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-[#3b3b40]">{title}</h3>
        <p className="text-sm text-[#8b8b90]">{description}</p>
      </div>
    </div>
  );
}
