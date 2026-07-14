'use client';

import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '../types';

// Socket instance
let socket: Socket | null = null;
/** JWT currently bound to the live socket (reuse connection across useSocket callers). */
let activeAuthToken: string | null = null;
/** userId reported by the server for the active socket connection */
let socketAuthenticatedUserId: string | null = null;

const connectHandlers = new Set<() => void>();
const disconnectHandlers = new Set<() => void>();
const errorHandlers = new Set<(error: Error) => void>();
let tokenExpiredHandler: (() => Promise<string | null>) | null = null;

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getWebSocketUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
    ? stripWrappingQuotes(process.env.NEXT_PUBLIC_API_URL)
    : '';

  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    if (host.includes(':3000')) {
      return `${protocol}//${host.split(':')[0]}:4000`;
    }
    return `${protocol}//${host}`;
  }

  return 'http://localhost:4000';
}

const WS_URL = getWebSocketUrl();

export interface SocketOptions {
  token: string;
  force?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onTokenExpired?: () => Promise<string | null>;
}

function destroySocketInstance(instance: Socket | null): void {
  if (!instance) return;
  instance.removeAllListeners();
  // Prevent orphan reconnects as a previous account after we drop the reference.
  instance.io.reconnection(false);
  instance.disconnect();
}

function notifyConnect(): void {
  connectHandlers.forEach((handler) => handler());
}

function notifyDisconnect(): void {
  disconnectHandlers.forEach((handler) => handler());
}

function notifyError(error: Error): void {
  errorHandlers.forEach((handler) => handler(error));
}

/**
 * Register connect/disconnect listeners without recreating the socket.
 * Safe for multiple concurrent useSocket() callers (list + window).
 */
export function registerSocketLifecycle(handlers: {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}): () => void {
  if (handlers.onConnect) connectHandlers.add(handlers.onConnect);
  if (handlers.onDisconnect) disconnectHandlers.add(handlers.onDisconnect);
  if (handlers.onError) errorHandlers.add(handlers.onError);

  return () => {
    if (handlers.onConnect) connectHandlers.delete(handlers.onConnect);
    if (handlers.onDisconnect) disconnectHandlers.delete(handlers.onDisconnect);
    if (handlers.onError) errorHandlers.delete(handlers.onError);
  };
}

function canReuseSocket(token: string, force?: boolean): boolean {
  if (force || !socket || activeAuthToken !== token) return false;
  // Keep the same connection while it is up or still trying to reconnect.
  return socket.connected || Boolean(socket.active);
}

/**
 * Initialize and get socket connection.
 * Reuses the existing socket when the token is unchanged so nested useSocket
 * callers do not wipe presence event listeners.
 */
export function initSocket(options: SocketOptions): Socket {
  if (options.onTokenExpired) {
    tokenExpiredHandler = options.onTokenExpired;
  }

  if (canReuseSocket(options.token, options.force) && socket) {
    if (socket.connected) {
      options.onConnect?.();
    }
    return socket;
  }

  destroySocketInstance(socket);
  socket = null;
  socketAuthenticatedUserId = null;
  activeAuthToken = options.token;

  socket = io(`${WS_URL}/chat`, {
    auth: { token: options.token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected');
    notifyConnect();
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    socketAuthenticatedUserId = null;
    notifyDisconnect();
  });

  socket.on('connect_error', async (error) => {
    console.error('[Socket] Connection error:', error.message);

    if (
      error.message?.includes('expired') ||
      error.message?.includes('jwt') ||
      error.message?.includes('TokenExpiredError')
    ) {
      if (tokenExpiredHandler) {
        try {
          const newToken = await tokenExpiredHandler();
          if (newToken && socket) {
            activeAuthToken = newToken;
            socket.auth = { token: newToken };
            socket.connect();
            return;
          }
        } catch (refreshError) {
          console.error('[Socket] Failed to refresh token:', refreshError);
        }
      }
    }

    notifyError(error);
  });

  socket.on('connection:error', async (data: { code?: string; message?: string }) => {
    if (data?.code === 'TOKEN_EXPIRED' && tokenExpiredHandler) {
      try {
        const newToken = await tokenExpiredHandler();
        if (newToken && socket) {
          activeAuthToken = newToken;
          socket.auth = { token: newToken };
          socket.connect();
          return;
        }
      } catch (e) {
        console.error('[Socket] Failed to refresh token after TOKEN_EXPIRED:', e);
      }
    }
    notifyError(new Error(data?.message ?? 'Connection error'));
  });

  socket.on('connection:success', (data: { userId?: string }) => {
    socketAuthenticatedUserId = data?.userId ?? null;
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function getSocketAuthenticatedUserId(): string | null {
  return socketAuthenticatedUserId;
}

export function setSocketAuthenticatedUserId(userId: string | null): void {
  socketAuthenticatedUserId = userId;
}

export function disconnectSocket(): void {
  destroySocketInstance(socket);
  socket = null;
  socketAuthenticatedUserId = null;
  activeAuthToken = null;
  tokenExpiredHandler = null;
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

export function emitSendMessage(
  chatId: string,
  content: string,
  type: string = 'TEXT',
  metadata?: Record<string, unknown>,
): Promise<{ success: boolean; message?: unknown; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false, error: 'Not connected' });
      return;
    }

    socket.emit(
      'message:send',
      { chatId, content, type, metadata },
      (response: { success: boolean; message?: unknown; error?: string }) => {
        resolve(response);
      },
    );
  });
}

export function emitEditMessage(
  messageId: string,
  content: string,
): Promise<{ success: boolean; message?: unknown; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false, error: 'Not connected' });
      return;
    }

    socket.emit(
      'message:edit',
      { messageId, content },
      (response: { success: boolean; message?: unknown; error?: string }) => {
        resolve(response);
      },
    );
  });
}

export function emitDeleteMessage(
  messageId: string,
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false, error: 'Not connected' });
      return;
    }

    socket.emit(
      'message:delete',
      { messageId },
      (response: { success: boolean; error?: string }) => {
        resolve(response);
      },
    );
  });
}

export function emitTypingStart(chatId: string): void {
  socket?.emit('typing:start', { chatId });
}

export function emitTypingStop(chatId: string): void {
  socket?.emit('typing:stop', { chatId });
}

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

export function emitJoinChat(chatId: string): Promise<{
  success: boolean;
  onlineUsers?: string[];
  presence?: Array<{ userId: string; isOnline: boolean; lastSeenAt?: string | null }>;
  error?: string;
}> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false });
      return;
    }

    socket.emit(
      'chat:join',
      { chatId },
      (response: {
        success: boolean;
        onlineUsers?: string[];
        presence?: Array<{ userId: string; isOnline: boolean; lastSeenAt?: string | null }>;
        error?: string;
      }) => {
        resolve(response);
      },
    );
  });
}

export function emitSendVocabulary(
  chatId: string,
  words: string[],
): Promise<{ success: boolean; message?: unknown; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false, error: 'Not connected' });
      return;
    }

    socket.emit(
      'vocabulary:send',
      { chatId, words },
      (response: { success: boolean; message?: unknown; error?: string }) => {
        resolve(response);
      },
    );
  });
}

type EventHandler<T> = (data: T) => void;

export function onSocketEvent<K extends keyof SocketEvents>(
  event: K,
  handler: EventHandler<SocketEvents[K]>,
): () => void {
  socket?.on(event as never, handler as never);

  return () => {
    socket?.off(event as never, handler as never);
  };
}
