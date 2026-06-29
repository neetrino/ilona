import type { ChatContainerLayout } from './chat-container.types';

export function resolveReturnToPath(returnTo: string | null): string | null {
  if (!returnTo) {
    return null;
  }
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
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

export function getChatContainerLayout(
  className: string | undefined,
  role: string | undefined,
  _activeChat: unknown,
): ChatContainerLayout {
  const isFullScreen = className?.includes('rounded-none') ?? false;
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';
  const useAdminPortalLayout = (isTeacher || isStudent) && isFullScreen;
  const containerHeight = useAdminPortalLayout
    ? 'min-h-0 flex-1 lg:min-h-0 lg:h-auto'
    : isFullScreen
      ? 'h-screen'
      : 'h-[calc(100vh-200px)]';
  const contentHeight = useAdminPortalLayout
    ? 'flex-1 min-h-0'
    : isFullScreen
      ? 'h-[calc(100vh-73px)]'
      : 'h-[calc(100%-73px)]';

  return {
    isFullScreen,
    isTeacher,
    isStudent,
    useAdminPortalLayout,
    containerHeight,
    contentHeight,
  };
}
