'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

type UseChatMessageNavigationParams = {
  navigableMessageIds: string[];
  chatId: string;
  endAnchorRef: RefObject<HTMLElement | null>;
};

export function useChatMessageNavigation({
  navigableMessageIds,
  chatId,
  endAnchorRef,
}: UseChatMessageNavigationParams) {
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    setFocusedMessageId(null);
  }, [chatId]);

  useEffect(() => {
    if (focusedMessageId && !navigableMessageIds.includes(focusedMessageId)) {
      setFocusedMessageId(null);
    }
  }, [navigableMessageIds, focusedMessageId]);

  const registerMessageElement = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      elementRefs.current.set(id, el);
    } else {
      elementRefs.current.delete(id);
    }
  }, []);

  const focusedIndex = useMemo(() => {
    if (!focusedMessageId) return null;
    const i = navigableMessageIds.indexOf(focusedMessageId);
    return i === -1 ? null : i;
  }, [focusedMessageId, navigableMessageIds]);

  const scrollToMessage = useCallback((id: string) => {
    elementRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const goToPrevious = useCallback(() => {
    const n = navigableMessageIds.length;
    if (n < 2) return;

    if (focusedIndex === null) {
      const id = navigableMessageIds[n - 2];
      if (!id) return;
      setFocusedMessageId(id);
      scrollToMessage(id);
      return;
    }

    if (focusedIndex <= 0) return;

    const id = navigableMessageIds[focusedIndex - 1];
    if (!id) return;
    setFocusedMessageId(id);
    scrollToMessage(id);
  }, [navigableMessageIds, focusedIndex, scrollToMessage]);

  const goToNext = useCallback(() => {
    const n = navigableMessageIds.length;
    if (n === 0 || focusedIndex === null) return;

    if (focusedIndex >= n - 1) {
      setFocusedMessageId(null);
      endAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      return;
    }

    const id = navigableMessageIds[focusedIndex + 1];
    if (!id) return;
    setFocusedMessageId(id);
    scrollToMessage(id);
  }, [navigableMessageIds, focusedIndex, scrollToMessage, endAnchorRef]);

  const canGoPrevious =
    navigableMessageIds.length >= 2 && (focusedIndex === null || focusedIndex > 0);

  const canGoNext = focusedIndex !== null;

  return {
    focusedMessageId,
    registerMessageElement,
    goToPrevious,
    goToNext,
    canGoPrevious,
    canGoNext,
  };
}
