'use client';

import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '../types';

// Socket instance
let socket: Socket | null = null;

// Get WebSocket URL - same logic as API URL
function getWebSocketUrl(): string {
  // If explicitly set in environment, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
  }

  // In browser, construct from current host
  if (typeof window !== 'undefined') {
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    // If running on port 3000, assume API is on 4000
    // Otherwise, use same host and port
    if (host.includes(':3000')) {
      return `${protocol}//${host.split(':')[0]}:4000`;
    }
    // For production or custom ports, use same host
    return `${protocol}//${host}`;
  }

  // Server-side fallback
  return 'http://localhost:4000';
}

const WS_URL = getWebSocketUrl();

export interface SocketOptions {
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onTokenExpired?: () => Promise<string | null>; // Callback to refresh token
}

/**
 * Initialize and get socket connection
 */
export function initSocket(options: SocketOptions): Socket {
  if (socket?.connected) {
    // Socket already connected, call onConnect callback to sync state
    options.onConnect?.();
    return socket;
  }

  // Disconnect existing socket if any (only if it exists and is not already disconnected)
  if (socket) {
    // Remove all listeners to prevent memory leaks
    socket.removeAllListeners();
    // Only disconnect if already connected to avoid closing during connection attempt
    if (socket.connected) {
      socket.disconnect();
    }
    // Clear the socket reference
    socket = null;
  }

  // Create new socket connection
  socket = io(`${WS_URL}/chat`, {
    auth: { token: options.token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  // Connection events
  socket.on('connect', () => {
    console.log('[Socket] Connected');
    options.onConnect?.();
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    options.onDisconnect?.();
  });

  socket.on('connect_error', async (error) => {
    console.error('[Socket] Connection error:', error.message);
    
    // If token expired, try to refresh
    if (error.message?.includes('expired') || error.message?.includes('jwt') || error.message?.includes('TokenExpiredError')) {
      if (options.onTokenExpired) {
        try {
          const newToken = await options.onTokenExpired();
          if (newToken && socket) {
            // Reconnect with new token
            socket.auth = { token: newToken };
            socket.connect();
            return;
          }
        } catch (refreshError) {
          console.error('[Socket] Failed to refresh token:', refreshError);
        }
      }
    }
    
    options.onError?.(error);
  });

  return socket;
}

/**
 * Get current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    // Remove all listeners first
    socket.removeAllListeners();
    // Only disconnect if already connected to avoid closing during connection attempt
    if (socket.connected) {
      socket.disconnect();
    }
    // Clear the socket reference
    socket = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

// ============ EMIT HELPERS ============

/**
 * Send a message
 */
export function emitSendMessage(
  chatId: string,
  content: string,
  type: string = 'TEXT',
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; message?: unknown; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false, error: 'Not connected' });
      return;
    }

    socket.emit('message:send', { chatId, content, type, metadata }, (response: { success: boolean; message?: unknown; error?: string }) => {
      resolve(response);
    });
  });
}

/**
 * Edit a message
 */
export function emitEditMessage(
  messageId: string,
  content: string
): Promise<{ success: boolean; message?: unknown; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false, error: 'Not connected' });
      return;
    }

    socket.emit('message:edit', { messageId, content }, (response: { success: boolean; message?: unknown; error?: string }) => {
      resolve(response);
    });
  });
}

/**
 * Delete a message
 */
export function emitDeleteMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false, error: 'Not connected' });
      return;
    }

    socket.emit('message:delete', { messageId }, (response: { success: boolean; error?: string }) => {
      resolve(response);
    });
  });
}

/**
 * Start typing indicator
 */
export function emitTypingStart(chatId: string): void {
  socket?.emit('typing:start', { chatId });
}

/**
 * Stop typing indicator
 */
export function emitTypingStop(chatId: string): void {
  socket?.emit('typing:stop', { chatId });
}

/**
 * Mark chat as read
 */
export function emitMarkAsRead(chatId: string): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false });
      return;
    }

    socket.emit('chat:read', { chatId }, (response: { success: boolean }) => {
      resolve(response);
    });
  });
}

/**
 * Join a chat room
 */
export function emitJoinChat(chatId: string): Promise<{ success: boolean; onlineUsers?: string[] }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false });
      return;
    }

    socket.emit('chat:join', { chatId }, (response: { success: boolean; onlineUsers?: string[] }) => {
      resolve(response);
    });
  });
}

/**
 * Send vocabulary (teacher feature)
 */
export function emitSendVocabulary(
  chatId: string,
  words: string[]
): Promise<{ success: boolean; message?: unknown; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false, error: 'Not connected' });
      return;
    }

    socket.emit('vocabulary:send', { chatId, words }, (response: { success: boolean; message?: unknown; error?: string }) => {
      resolve(response);
    });
  });
}

// ============ SUBSCRIBE HELPERS ============

type EventHandler<T> = (data: T) => void;

/**
 * Subscribe to socket events
 */
export function onSocketEvent<K extends keyof SocketEvents>(
  event: K,
  handler: EventHandler<SocketEvents[K]>
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  socket?.on(event, handler as any);

  // Return unsubscribe function
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    socket?.off(event, handler as any);
  };
}
