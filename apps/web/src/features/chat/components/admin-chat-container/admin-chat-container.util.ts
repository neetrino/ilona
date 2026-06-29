import type { AdminChatContainerLayout } from './admin-chat-container.types';

export function getAdminChatContainerLayout(className: string | undefined): AdminChatContainerLayout {
  const isFullScreen = className?.includes('rounded-none') ?? false;
  const containerHeight = isFullScreen
    ? 'min-h-0 flex-1 lg:min-h-0 lg:h-auto'
    : 'h-[calc(100vh-200px)]';
  const contentHeight = isFullScreen ? 'flex-1 min-h-0' : 'h-[calc(100%-73px)]';

  return { isFullScreen, containerHeight, contentHeight };
}

export function resolveAdminReturnToPath(returnTo: string | null): string | null {
  if (!returnTo?.startsWith('/') || returnTo.startsWith('//')) {
    return null;
  }
  try {
    const testUrl = new URL(returnTo, window.location.origin);
    if (testUrl.origin === window.location.origin) {
      return returnTo;
    }
  } catch {
    return returnTo;
  }
  return null;
}

export const ADMIN_CHAT_VALID_TABS = ['students', 'teachers', 'groups'] as const;
