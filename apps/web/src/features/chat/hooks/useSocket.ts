'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  initSocket,
  disconnectSocket,
  isSocketConnected,
  getSocket,
  getSocketAuthenticatedUserId,
  setSocketAuthenticatedUserId,
  registerSocketLifecycle,
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
import { markChatAsRead, sendMessageHttp } from '../api/chat.api';
import { useChatStore } from '../store/chat.store';
import {
  chatKeys,
  clearChatUnreadInCache,
  createOptimisticTextMessage,
  PENDING_MESSAGE_ID_PREFIX,
  pushMessageToCache,
  removeMessageFromMessagesCache,
  upsertIncomingMessageInCache,
} from './useChat';
import type { Message } from '../types';

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
  // Initialize with current socket connection status
  const [isConnected, setIsConnected] = useState(() => isSocketConnected());
  const [onlineUsers, setOnlineUsers] = useState<Map<string, Set<string>>>(new Map());
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize / reuse shared socket; multiple callers must not tear it down.
  useEffect(() => {
    if (!token) {
      disconnectSocket();
      setIsConnected(false);
      return;
    }

    const unregisterLifecycle = registerSocketLifecycle({
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onError: (error) => {
        console.error('[useSocket] Error:', error);
      },
    });

    initSocket({
      token,
      onTokenExpired: async () => {
        try {
          const refreshed = await refreshTokenFn?.();
          if (refreshed) {
            return useAuthStore.getState().tokens?.accessToken || null;
          }
        } catch (refreshError) {
          console.error('[useSocket] Failed to refresh token:', refreshError);
        }
        return null;
      },
    });

    setIsConnected(isSocketConnected());

    return () => {
      unregisterLifecycle();
    };
  }, [token, refreshTokenFn]);

  // Subscribe to events (separate effect to avoid re-subscribing on token change)
  // Note: This effect should only run once, not on token changes
  useEffect(() => {
    if (!token) return;

    // Subscribe to events
    const unsubscribers: (() => void)[] = [];

    // Connection success - get initial online users + verify socket identity
    unsubscribers.push(
      onSocketEvent('connection:success', (data) => {
        setSocketAuthenticatedUserId(data.userId);
        const currentUserId = useAuthStore.getState().user?.id;
        if (currentUserId && data.userId && data.userId !== currentUserId) {
          console.error(
            '[useSocket] Socket identity mismatch — reconnecting with current session',
            { socketUserId: data.userId, currentUserId },
          );
          const accessToken = useAuthStore.getState().tokens?.accessToken;
          if (accessToken) {
            initSocket({
              token: accessToken,
              force: true,
              onTokenExpired: async () => {
                try {
                  const refreshed = await refreshTokenFn?.();
                  if (refreshed) {
                    return useAuthStore.getState().tokens?.accessToken || null;
                  }
                } catch {
                  // ignore
                }
                return null;
              },
            });
          } else {
            disconnectSocket();
            setIsConnected(false);
          }
          return;
        }

        const newOnlineUsers = new Map<string, Set<string>>();
        data.chats.forEach((chat) => {
          newOnlineUsers.set(chat.id, new Set(chat.onlineUsers));
          chat.onlineUsers.forEach((userId) => {
            useChatStore.getState().setUserOnline(userId);
          });
        });
        setOnlineUsers(newOnlineUsers);
        if (data.presence?.length) {
          useChatStore.getState().mergePresence(data.presence);
        }
      })
    );

    // New message
    unsubscribers.push(
      onSocketEvent('message:new', (message) => {
        upsertIncomingMessageInCache(queryClient, message.chatId, message);

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
        useChatStore.getState().setUserOnline(data.userId);
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
        useChatStore.getState().setUserOffline(data.userId, data.lastSeenAt);
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

    // Chat read event - update cache when chat is marked as read
    // Note: This is handled in markAsRead callback, but we keep this for completeness
    // (in case other clients mark as read, though we don't need to update our cache for that)

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      // Don't disconnect socket here - it's managed by the initialization effect
      // Only unsubscribe from events
    };
  }, [queryClient, token, refreshTokenFn]);

  // Send message
  const sendMessage = useCallback(
    async (chatId: string, content: string, type = 'TEXT') => {
      const trimmedContent = content.trim();
      if (!trimmedContent) return { success: false, error: 'Empty message' };

      const { user } = useAuthStore.getState();
      if (!user) return { success: false, error: 'Not authenticated' };

      const clientId = `${PENDING_MESSAGE_ID_PREFIX}${crypto.randomUUID()}`;
      const optimisticMessage = createOptimisticTextMessage({
        clientId,
        chatId,
        content: trimmedContent,
        type: type as Message['type'],
        senderId: user.id,
        sender: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      });

      pushMessageToCache(queryClient, chatId, optimisticMessage);

      const confirmMessage = (message: Message) => {
        if (message.senderId !== user.id) {
          console.error(
            '[useSocket] Rejecting message with unexpected senderId',
            { expected: user.id, actual: message.senderId, chatId },
          );
          return false;
        }
        upsertIncomingMessageInCache(queryClient, chatId, message);
        return true;
      };

      const revertOptimisticMessage = () => {
        removeMessageFromMessagesCache(queryClient, chatId, clientId);
        void queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      };

      const socketUserId = getSocketAuthenticatedUserId();
      const socketIdentityOk =
        isSocketConnected() && (!socketUserId || socketUserId === user.id);

      // Try socket first only when its identity matches the current user
      if (socketIdentityOk) {
        const socketResult = await emitSendMessage(chatId, trimmedContent, type);
        if (socketResult.success) {
          if (socketResult.message) {
            const accepted = confirmMessage(socketResult.message as Message);
            if (!accepted) {
              revertOptimisticMessage();
              disconnectSocket();
              return {
                success: false,
                error: 'Message sender identity mismatch',
              };
            }
          }
          return socketResult;
        }
      }

      // Fallback to HTTP (always uses the current access token)
      try {
        const message = await sendMessageHttp(chatId, trimmedContent, type);
        const accepted = confirmMessage(message);
        if (!accepted) {
          revertOptimisticMessage();
          return {
            success: false,
            error: 'Message sender identity mismatch',
          };
        }
        return { success: true, message };
      } catch (error) {
        revertOptimisticMessage();
        console.error('[useSocket] Failed to send message via HTTP:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send message',
        };
      }
    },
    [queryClient],
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
    clearChatUnreadInCache(queryClient, chatId);

    // Try socket first, fallback to HTTP if socket not connected
    let result = await emitMarkAsRead(chatId);

    // If socket failed (not connected), try HTTP API as fallback
    if (!result.success) {
      try {
        result = await markChatAsRead(chatId);
      } catch (error) {
        console.error('[useSocket] Failed to mark as read via HTTP:', error);
        return { success: false };
      }
    }

    if (result.success) {
      clearChatUnreadInCache(queryClient, chatId);
    }

    return result;
  }, [queryClient]);

  // Join chat
  const joinChat = useCallback(async (chatId: string) => {
    const result = await emitJoinChat(chatId);
    if (result.success) {
      if (result.presence?.length) {
        useChatStore.getState().mergePresence(result.presence);
      }
      if (result.onlineUsers?.length) {
        setOnlineUsers((prev) => {
          const next = new Map(prev);
          next.set(chatId, new Set(result.onlineUsers));
          return next;
        });
        result.onlineUsers.forEach((userId) => {
          useChatStore.getState().setUserOnline(userId);
        });
      }
    }
    return result;
  }, []);

  // Send vocabulary (teacher feature)
  const sendVocabulary = useCallback(
    async (chatId: string, words: string[]) => {
      return emitSendVocabulary(chatId, words);
    },
    []
  );

  // Shared presence store — consistent for every role / hook instance
  const isUserOnline = useCallback((_chatId: string, userId: string) => {
    return useChatStore.getState().isUserPresent(userId);
  }, []);

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
 * Hook to get connection status (event-based, not polling)
 */
export function useSocketStatus() {
  const [isConnected, setIsConnected] = useState(() => isSocketConnected());

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      setIsConnected(false);
      return;
    }

    // Set initial state
    setIsConnected(socket.connected);

    // Listen to connection events instead of polling
    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  return isConnected;
}
