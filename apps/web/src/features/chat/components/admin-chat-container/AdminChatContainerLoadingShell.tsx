'use client';

import { cn } from '@/shared/lib/utils';
import type { AdminChatContainerProps } from './admin-chat-container.types';
import { getAdminChatContainerLayout } from './admin-chat-container.util';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

export function AdminChatContainerLoadingShell({ className }: AdminChatContainerProps) {
  const { isFullScreen } = getAdminChatContainerLayout(className);

  return (
    <div
      className={cn(
        isFullScreen ? 'min-h-0 flex-1 h-full' : 'h-[calc(100vh-200px)]',
        'overflow-hidden bg-white',
        !isFullScreen && 'rounded-2xl border border-slate-200',
        className,
      )}
    >
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    </div>
  );
}
