'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';
import { MobileChatSlidePanel } from './MobileChatSlidePanel';
import { ChatWindow } from './ChatWindow';
import { CreateGroupChatModal } from './CreateGroupChatModal';
import { ADMIN_PORTAL_MOBILE_BOTTOM_NAV_OFFSET_CLASS } from '@/features/admin-dashboard/admin-portal-layout';
import { useAdminChatContainer } from './admin-chat-container/useAdminChatContainer';
import { AdminChatContainerHeader } from './admin-chat-container/AdminChatContainerHeader';
import { AdminChatContainerListPane } from './admin-chat-container/AdminChatContainerListPane';
import { AdminChatContainerDesktopPane } from './admin-chat-container/AdminChatContainerDesktopPane';
import { AdminChatContainerLoadingShell } from './admin-chat-container/AdminChatContainerLoadingShell';
import type { AdminChatContainerProps } from './admin-chat-container/admin-chat-container.types';

export type { AdminChatContainerProps } from './admin-chat-container/admin-chat-container.types';

function AdminChatContent(props: AdminChatContainerProps) {
  const vm = useAdminChatContainer(props);
  const { layout, activeChat, className, mobileChatPanelOpen, handleMobileBack, finalizeMobileChatClose, setActiveChat } =
    vm;
  const { isFullScreen, containerHeight, contentHeight } = layout;

  return (
    <div
      className={cn(
        containerHeight,
        'flex flex-col overflow-hidden bg-white',
        !isFullScreen && 'rounded-2xl border border-slate-200',
        isFullScreen && 'max-lg:max-h-[100dvh] max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-hidden',
        activeChat && isFullScreen && 'max-lg:h-[100dvh]',
        className,
      )}
    >
      <AdminChatContainerHeader vm={vm} />

      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row',
          contentHeight,
          isFullScreen && !activeChat && ADMIN_PORTAL_MOBILE_BOTTOM_NAV_OFFSET_CLASS,
        )}
      >
        <AdminChatContainerListPane vm={vm} />
        <AdminChatContainerDesktopPane vm={vm} />
      </div>

      {activeChat ? (
        <MobileChatSlidePanel
          active={mobileChatPanelOpen}
          onExitComplete={finalizeMobileChatClose}
          className="lg:hidden"
        >
          <ChatWindow chat={activeChat} onBack={handleMobileBack} onChatUpdated={setActiveChat} />
        </MobileChatSlidePanel>
      ) : null}

      <CreateGroupChatModal
        open={vm.showCreateGroupChatModal}
        onOpenChange={vm.setShowCreateGroupChatModal}
        onCreated={vm.handleCustomGroupChatCreated}
      />
    </div>
  );
}

export function AdminChatContainer(props: AdminChatContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <AdminChatContainerLoadingShell {...props} />;
  }

  return <AdminChatContent {...props} />;
}
