'use client';

import { useEffect } from 'react';

/**
 * Esc leaves the open conversation but stays on the chat page (idle / select-a-chat).
 * Skips when a dialog or open chat header menu should consume Esc first.
 */
export function useEscapeToLeaveChatConversation(
  isConversationOpen: boolean,
  onLeaveConversation: () => void,
): void {
  useEffect(() => {
    if (!isConversationOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (event.defaultPrevented) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (document.querySelector('[data-chat-header-menu="open"]')) return;

      event.preventDefault();
      onLeaveConversation();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConversationOpen, onLeaveConversation]);
}
