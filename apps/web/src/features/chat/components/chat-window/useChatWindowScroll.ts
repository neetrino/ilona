import { useEffect, useLayoutEffect, useRef } from 'react';

export function useChatWindowScroll(chatId: string, isLoading: boolean, messagesLength: number) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastInitialScrollChatIdRef = useRef<string | null>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  useEffect(() => {
    lastInitialScrollChatIdRef.current = null;
    prevMessagesLengthRef.current = 0;
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

  useEffect(() => {
    if (!messagesEndRef.current || !messagesContainerRef.current || messagesLength === 0) return;
    if (messagesLength <= prevMessagesLengthRef.current) return;
    prevMessagesLengthRef.current = messagesLength;

    const container = messagesContainerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 200;

    if (isNearBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesLength, chatId]);

  return { messagesEndRef, messagesContainerRef };
}
