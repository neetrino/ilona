'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  initSocket,
  disconnectSocket,
  isSocketConnected,
  onSocketEvent,
  emitSendMessage,
  emitEditMessage,
  emitDeleteMessage,
  emitTypingStart,
  emitTypingStop,
  emitMarkAsRead,
  emitJoinChat,
  emitSendVocabulary,
} from '../lib/socket';
import { chatKeys } from './useChat';
import type { Message, Chat } from '../types';

interface UseSocketOptions {
  onNewMessage?: (message: Message) => void;
  onMessageEdited?: (message: Message) => void;
  onMessageDeleted?: (data: { messageId: string; chatId: string }) => void;
  onTypingStart?: (data: { chatId: string; userId: string }) => void;
  onTypingStop?: (data: { chatId: string; userId: string }) => void;
  onUserOnline?: (data: { chatId: string; userId: string }) => void;
  onUserOffline?: (data: { chatId: string; userId: string }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { tokens, refreshToken: refreshTokenFn } = useAuthStore();
  const token = tokens?.accessToken;
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, Set<string>>>(new Map());
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    let socketInitialized = false;

    const initializeSocket = async (currentToken: string) => {
      if (socketInitialized) return;
      
      initSocket({
        token: currentToken,
        onConnect: () => {
          setIsConnected(true);
          socketInitialized = true;
        },
        onDisconnect: () => {
          setIsConnected(false);
          socketInitialized = false;
        },
        onError: (error) => {
          console.error('[useSocket] Error:', error);
        },
        onTokenExpired: async () => {
          try {
            const refreshed = await refreshTokenFn?.();
            if (refreshed) {
              const newTokens = useAuthStore.getState().tokens;
              return newTokens?.accessToken || null;
            }
          } catch (refreshError) {
            console.error('[useSocket] Failed to refresh token:', refreshError);
          }
          return null;
        },
      });
    };

    void initializeSocket(token);

    // Cleanup on unmount or token change
    return () => {
      disconnectSocket();
    };
  }, [token, refreshTokenFn, queryClient]);

  // Subscribe to events (separate effect to avoid re-subscribing on token change)
  useEffect(() => {
    if (!token) return;

    // Subscribe to events
    const unsubscribers: (() => void)[] = [];

    // Connection success - get initial online users
    unsubscribers.push(
      onSocketEvent('connection:success', (data) => {
        const newOnlineUsers = new Map<string, Set<string>>();
        data.chats.forEach((chat) => {
          newOnlineUsers.set(chat.id, new Set(chat.onlineUsers));
        });
        setOnlineUsers(newOnlineUsers);
      })
    );

    // New message
    unsubscribers.push(
      onSocketEvent('message:new', (message) => {
        // Update messages cache
        queryClient.setQueryData(
          chatKeys.messages(message.chatId),
          (oldData: { pages: { items: Message[] }[] } | undefined) => {
            if (!oldData) return oldData;

            // Check if message already exists
            const exists = oldData.pages.some((page) =>
              page.items.some((m) => m.id === message.id)
            );
            if (exists) return oldData;

            return {
              ...oldData,
              pages: oldData.pages.map((page, index) => {
                if (index === oldData.pages.length - 1) {
                  return {
                    ...page,
                    items: [...page.items, message],
                  };
                }
                return page;
              }),
            };
          }
        );

        // Update chat list
        queryClient.setQueryData(
          chatKeys.list(),
          (oldData: Chat[] | undefined) => {
            if (!oldData) return oldData;

            return oldData.map((chat) => {
              if (chat.id === message.chatId) {
                return {
                  ...chat,
                  lastMessage: message,
                  updatedAt: message.createdAt,
                };
              }
              return chat;
            });
          }
        );

        optionsRef.current.onNewMessage?.(message);
      })
    );

    // Message edited
    unsubscribers.push(
      onSocketEvent('message:edited', (message) => {
        queryClient.setQueryData(
          chatKeys.messages(message.chatId),
          (oldData: { pages: { items: Message[] }[] } | undefined) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                items: page.items.map((m) =>
                  m.id === message.id ? message : m
                ),
              })),
            };
          }
        );

        optionsRef.current.onMessageEdited?.(message);
      })
    );

    // Message deleted (hard delete - remove completely)
    unsubscribers.push(
      onSocketEvent('message:deleted', (data) => {
        queryClient.setQueryData(
          chatKeys.messages(data.chatId),
          (oldData: { pages: { items: Message[] }[] } | undefined) => {
            if (!oldData) return oldData;

            // Remove the message completely from all pages
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                items: page.items.filter((m) => m.id !== data.messageId),
              })),
            };
          }
        );

        optionsRef.current.onMessageDeleted?.(data);
      })
    );

    // Typing indicators
    unsubscribers.push(
      onSocketEvent('typing:start', (data) => {
        optionsRef.current.onTypingStart?.(data);
      })
    );

    unsubscribers.push(
      onSocketEvent('typing:stop', (data) => {
        optionsRef.current.onTypingStop?.(data);
      })
    );

    // Online status
    unsubscribers.push(
      onSocketEvent('user:online', (data) => {
        setOnlineUsers((prev) => {
          const newMap = new Map(prev);
          const chatUsers = newMap.get(data.chatId) || new Set();
          chatUsers.add(data.userId);
          newMap.set(data.chatId, chatUsers);
          return newMap;
        });
        optionsRef.current.onUserOnline?.(data);
      })
    );

    unsubscribers.push(
      onSocketEvent('user:offline', (data) => {
        setOnlineUsers((prev) => {
          const newMap = new Map(prev);
          const chatUsers = newMap.get(data.chatId);
          if (chatUsers) {
            chatUsers.delete(data.userId);
            newMap.set(data.chatId, chatUsers);
          }
          return newMap;
        });
        optionsRef.current.onUserOffline?.(data);
      })
    );

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      disconnectSocket();
    };
  }, [token, queryClient]);

  // Send message
  const sendMessage = useCallback(
    async (chatId: string, content: string, type = 'TEXT') => {
      if (!content.trim()) return { success: false, error: 'Empty message' };
      return emitSendMessage(chatId, content.trim(), type);
    },
    []
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      return emitEditMessage(messageId, content);
    },
    []
  );

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    return emitDeleteMessage(messageId);
  }, []);

  // Typing indicators
  const startTyping = useCallback((chatId: string) => {
    emitTypingStart(chatId);
  }, []);

  const stopTyping = useCallback((chatId: string) => {
    emitTypingStop(chatId);
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (chatId: string) => {
    return emitMarkAsRead(chatId);
  }, []);

  // Join chat
  const joinChat = useCallback(async (chatId: string) => {
    return emitJoinChat(chatId);
  }, []);

  // Send vocabulary (teacher feature)
  const sendVocabulary = useCallback(
    async (chatId: string, words: string[]) => {
      return emitSendVocabulary(chatId, words);
    },
    []
  );

  // Check if user is online in a chat
  const isUserOnline = useCallback(
    (chatId: string, userId: string) => {
      return onlineUsers.get(chatId)?.has(userId) ?? false;
    },
    [onlineUsers]
  );

  // Get online users for a chat
  const getOnlineUsers = useCallback(
    (chatId: string) => {
      return Array.from(onlineUsers.get(chatId) || []);
    },
    [onlineUsers]
  );

  return {
    isConnected,
    sendMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    markAsRead,
    joinChat,
    sendVocabulary,
    isUserOnline,
    getOnlineUsers,
  };
}

/**
 * Hook to get connection status
 */
export function useSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(isSocketConnected());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return isConnected;
}
