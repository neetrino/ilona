'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChatStore } from '../store/chat.store';
import {
  initSocket,
  disconnectSocket,
  isSocketConnected,
  getSocket,
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
  // Initialize with current socket connection status
  const [isConnected, setIsConnected] = useState(() => isSocketConnected());
  const [onlineUsers, setOnlineUsers] = useState<Map<string, Set<string>>>(new Map());
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize socket connection
  // Only initialize once, socket.io handles reconnection and token refresh
  useEffect(() => {
    if (!token) {
      // If no token, disconnect socket
      disconnectSocket();
      setIsConnected(false);
      return;
    }

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

    // Only cleanup on unmount or when token becomes null
    // Don't disconnect on token refresh - socket.io handles that via onTokenExpired
    return () => {
      // Only disconnect if we're actually unmounting (no token)
      // The check happens at the start of the effect
    };
  }, [token, refreshTokenFn]);

  // Subscribe to events (separate effect to avoid re-subscribing on token change)
  // Note: This effect should only run once, not on token changes
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

        // Update chat list with new message, lastMessageAt, and unreadCount
        // Optimize: Only re-sort if the updated chat is not already first
        queryClient.setQueryData(
          chatKeys.list(),
          (oldData: Chat[] | undefined) => {
            if (!oldData) return oldData;

            const { user } = useAuthStore.getState();
            const isFromOtherUser = message.senderId !== user?.id;
            const messageTime = new Date(message.createdAt).getTime();

            // Find the chat index
            const chatIndex = oldData.findIndex((chat) => chat.id === message.chatId);
            if (chatIndex === -1) return oldData;

            // Update the chat
            const updatedChat = {
              ...oldData[chatIndex],
              lastMessage: message,
              lastMessageAt: message.createdAt,
              updatedAt: message.createdAt,
              unreadCount: isFromOtherUser 
                ? (oldData[chatIndex].unreadCount || 0) + 1 
                : oldData[chatIndex].unreadCount,
            };

            // If chat is already first, just update it without sorting
            if (chatIndex === 0) {
              const newData = [...oldData];
              newData[0] = updatedChat;
              return newData;
            }

            // Check if updated chat should be first (has newer message than current first)
            const firstChat = oldData[0];
            const firstChatTime = firstChat.lastMessageAt 
              ? new Date(firstChat.lastMessageAt).getTime()
              : (firstChat.lastMessage?.createdAt ? new Date(firstChat.lastMessage.createdAt).getTime() : new Date(firstChat.updatedAt).getTime());

            // If new message is older than first chat, just update in place
            if (messageTime <= firstChatTime) {
              const newData = [...oldData];
              newData[chatIndex] = updatedChat;
              return newData;
            }

            // New message is newest - move chat to top and re-sort only if needed
            const newData = [...oldData];
            newData[chatIndex] = updatedChat;
            
            // Move to front
            newData.splice(chatIndex, 1);
            newData.unshift(updatedChat);
            
            // Only sort if there are other chats that might have newer messages
            // (In practice, this is rare, so we can skip full sort)
            return newData;
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

    // Chat read event - update cache when chat is marked as read
    // Note: This is handled in markAsRead callback, but we keep this for completeness
    // (in case other clients mark as read, though we don't need to update our cache for that)

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      // Don't disconnect socket here - it's managed by the initialization effect
      // Only unsubscribe from events
    };
  }, [queryClient]);

  // Send message
  const sendMessage = useCallback(
    async (chatId: string, content: string, type = 'TEXT') => {
      if (!content.trim()) return { success: false, error: 'Empty message' };
      
      // Try socket first
      const socketResult = await emitSendMessage(chatId, content.trim(), type);
      if (socketResult.success) {
        return socketResult;
      }
      
      // Fallback to HTTP if socket is not connected
      try {
        const message = await sendMessageHttp(chatId, content.trim(), type);
        return { success: true, message };
      } catch (error) {
        console.error('[useSocket] Failed to send message via HTTP:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to send message' };
      }
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
    
    // Update cache after marking as read (set unreadCount to 0 for this chat)
    // This prevents infinite loops by updating cache directly instead of invalidating
    // Preserve all chat properties including groupId, type, participants, etc.
    if (result.success) {
      queryClient.setQueryData(
        chatKeys.list(),
        (oldData: Chat[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((chat) =>
            chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
          );
        }
      );
      
      // Also update the chat detail cache if it exists
      queryClient.setQueryData(
        chatKeys.detail(chatId),
        (oldData: Chat | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, unreadCount: 0 };
        }
      );
      
      // Update activeChat in store if it matches the chatId
      const { activeChat, setActiveChat } = useChatStore.getState();
      if (activeChat && activeChat.id === chatId) {
        setActiveChat({ ...activeChat, unreadCount: 0 });
      }
    }
    
    return result;
  }, [queryClient]);

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
