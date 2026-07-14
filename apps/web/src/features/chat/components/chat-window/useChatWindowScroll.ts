import { useEffect, useLayoutEffect, useRef } from 'react';

interface UseChatWindowScrollOptions {
  chatId: string;
  isLoading: boolean;
  messagesLength: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadOlder?: () => void;
}

export function useChatWindowScroll({
  chatId,
  isLoading,
  messagesLength,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadOlder,
}: UseChatWindowScrollOptions) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastInitialScrollChatIdRef = useRef<string | null>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  const pendingOlderScrollHeightRef = useRef<number | null>(null);

  useEffect(() => {
    lastInitialScrollChatIdRef.current = null;
    prevMessagesLengthRef.current = 0;
    pendingOlderScrollHeightRef.current = null;
  }, [chatId]);

  useLayoutEffect(() => {
    if (isLoading || messagesLength === 0) return;
    if (lastInitialScrollChatIdRef.current === chatId) return;
    if (!messagesEndRef.current || !messagesContainerRef.current) return;

    lastInitialScrollChatIdRef.current = chatId;
    prevMessagesLengthRef.current = messagesLength;

    const scrollToBottom = () => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };

    const rafId = requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });
    return () => cancelAnimationFrame(rafId);
  }, [chatId, isLoading, messagesLength]);

  // Preserve viewport when older messages are prepended via infinite scroll.
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    const previousHeight = pendingOlderScrollHeightRef.current;
    if (!container || previousHeight == null) return;

    container.scrollTop = container.scrollHeight - previousHeight;
    pendingOlderScrollHeightRef.current = null;
    prevMessagesLengthRef.current = messagesLength;
  }, [messagesLength]);

  useEffect(() => {
    if (!messagesEndRef.current || !messagesContainerRef.current || messagesLength === 0) return;
    if (pendingOlderScrollHeightRef.current != null) return;
    if (messagesLength <= prevMessagesLengthRef.current) return;
    prevMessagesLengthRef.current = messagesLength;

    const container = messagesContainerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 200;

    if (isNearBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesLength, chatId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !onLoadOlder) return;

    const handleScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return;
      if (container.scrollTop > 80) return;

      pendingOlderScrollHeightRef.current = container.scrollHeight;
      onLoadOlder();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, onLoadOlder, chatId]);

  return { messagesEndRef, messagesContainerRef };
}
