'use client';

import { cn } from '@/shared/lib/utils';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { getChatThemeForRole } from '../../lib/chat-theme';
import type { ChatContainerProps } from './chat-container.types';

interface ChatContainerLoadingShellProps extends ChatContainerProps {
  role: string | undefined;
}

export function ChatContainerLoadingShell({
  className,
  role,
}: ChatContainerLoadingShellProps) {
  const loadingUi = getChatThemeForRole(role);
  const isFullScreenLoading = className?.includes('rounded-none');
  const isPortalChatLoading =
    (role === 'TEACHER' || role === 'STUDENT') && isFullScreenLoading;

  return (
    <div
      className={cn(
        isPortalChatLoading
          ? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-white max-lg:max-h-[100dvh] max-lg:min-h-0 max-lg:flex-1 lg:h-full'
          : cn('h-[calc(100vh-200px)] overflow-hidden', loadingUi.shell),
        className,
      )}
    >
      <div className="flex h-full min-h-0 flex-1 items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    </div>
  );
}
