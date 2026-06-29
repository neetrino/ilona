'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { MobileChatSlidePanel } from './MobileChatSlidePanel';
import { ChatWindow } from './ChatWindow';
import { useChatContainer } from './chat-container/useChatContainer';
import { ChatContainerHeader } from './chat-container/ChatContainerHeader';
import { ChatContainerListPane } from './chat-container/ChatContainerListPane';
import { ChatContainerDesktopPane } from './chat-container/ChatContainerDesktopPane';
import { ChatContainerLoadingShell } from './chat-container/ChatContainerLoadingShell';
import { cn } from '@/shared/lib/utils';
import { PORTAL_MOBILE_BOTTOM_NAV_OFFSET_CLASS } from '@/shared/lib/portal-mobile-layout';
import type { ChatContainerProps } from './chat-container/chat-container.types';

export type { ChatContainerProps } from './chat-container/chat-container.types';

function ChatContent(props: ChatContainerProps) {
  const vm = useChatContainer(props);
  const { layout, activeChat, className, mobileChatPanelOpen, handleMobileBack, finalizeMobileChatClose, setActiveChat } =
    vm;
  const { useAdminPortalLayout, containerHeight, contentHeight } = layout;

  return (
    <div
      className={cn(
        useAdminPortalLayout
          ? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-white max-lg:max-h-[100dvh] max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-hidden lg:min-h-0 lg:h-auto'
          : cn(containerHeight, vm.ui.shell, 'flex flex-col overflow-hidden'),
        useAdminPortalLayout && activeChat && 'max-lg:h-[100dvh]',
        className,
      )}
    >
      <ChatContainerHeader vm={vm} />

      <div
        className={cn(
          'flex min-h-0 flex-1 overflow-hidden',
          useAdminPortalLayout ? 'flex-col lg:flex-row' : contentHeight,
          useAdminPortalLayout && !activeChat && PORTAL_MOBILE_BOTTOM_NAV_OFFSET_CLASS,
        )}
      >
        <ChatContainerListPane vm={vm} />
        <ChatContainerDesktopPane vm={vm} />
      </div>

      {activeChat ? (
        <MobileChatSlidePanel
          active={mobileChatPanelOpen}
          onExitComplete={finalizeMobileChatClose}
          className="lg:hidden"
        >
          <ChatWindow
            chat={activeChat}
            onBack={handleMobileBack}
            onChatUpdated={setActiveChat}
          />
        </MobileChatSlidePanel>
      ) : null}
    </div>
  );
}

export function ChatContainer(props: ChatContainerProps) {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ChatContainerLoadingShell {...props} role={user?.role} />;
  }

  return <ChatContent {...props} />;
}
