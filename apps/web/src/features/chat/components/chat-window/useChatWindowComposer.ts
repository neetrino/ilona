import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useChatStore } from '../../store/chat.store';

interface UseChatWindowComposerOptions {
  chatId: string;
  isConnected: boolean;
  useMobileComposerSizing: boolean;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  sendMessage: (chatId: string, content: string) => Promise<{ success: boolean; error?: string }>;
}

const MIN_TEXTAREA_HEIGHT = 40;
const MAX_TEXTAREA_HEIGHT = 200;

export function useChatWindowComposer({
  chatId,
  isConnected,
  useMobileComposerSizing,
  startTyping,
  stopTyping,
  sendMessage,
}: UseChatWindowComposerOptions) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getDraft, setDraft, clearDraft } = useChatStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const draft = getDraft(chatId);
    setInputValue(draft || '');
  }, [chatId, getDraft]);

  useLayoutEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    if (useMobileComposerSizing) {
      ta.style.height = '40px';
      ta.style.overflowY = 'hidden';
      return;
    }
    ta.style.overflowY = 'hidden';
    ta.style.height = '0';
    const contentHeight = ta.scrollHeight;
    const h = Math.max(MIN_TEXTAREA_HEIGHT, Math.min(contentHeight, MAX_TEXTAREA_HEIGHT));
    ta.style.height = `${h}px`;
    ta.style.overflowY = h >= MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, [inputValue, useMobileComposerSizing]);

  useEffect(() => {
    return () => {
      if (inputValue.trim()) {
        setDraft(chatId, inputValue);
      } else {
        clearDraft(chatId);
      }
    };
  }, [chatId, inputValue, setDraft, clearDraft]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    if (isConnected) {
      startTyping(chatId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(chatId);
      }, 2000);
    }
  };

  const handleSend = useCallback(() => {
    const content = inputValue.trim();
    if (!content) return;

    setInputValue('');
    clearDraft(chatId);
    stopTyping(chatId);

    void sendMessage(chatId, content).then((result) => {
      if (!result.success) {
        console.error('Failed to send message:', result.error);
        setInputValue(content);
      }
    });
  }, [inputValue, chatId, sendMessage, clearDraft, stopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return {
    inputRef,
    inputValue,
    handleInputChange,
    handleSend,
    handleKeyDown,
  };
}
