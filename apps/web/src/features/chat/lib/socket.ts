'use client';

import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '../types';

// Socket instance
let socket: Socket | null = null;
/** userId reported by the server for the active socket connection */
let socketAuthenticatedUserId: string | null = null;

function getWebSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
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

/**
 * Initialize and get socket connection.
 * Always tears down any existing connection so a new token = new identity.
 */
export function initSocket(options: SocketOptions): Socket {
  destroySocketInstance(socket);
  socket = null;
  socketAuthenticatedUserId = null;

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
    options.onConnect?.();
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    socketAuthenticatedUserId = null;
    options.onDisconnect?.();
  });

  socket.on('connect_error', async (error) => {
    console.error('[Socket] Connection error:', error.message);

    if (
      error.message?.includes('expired') ||
      error.message?.includes('jwt') ||
      error.message?.includes('TokenExpiredError')
    ) {
      if (options.onTokenExpired) {
        try {
          const newToken = await options.onTokenExpired();
          if (newToken && socket) {
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

  socket.on('connection:error', async (data: { code?: string; message?: string }) => {
    if (data?.code === 'TOKEN_EXPIRED' && options.onTokenExpired) {
      try {
        const newToken = await options.onTokenExpired();
        if (newToken && socket) {
          socket.auth = { token: newToken };
          socket.connect();
          return;
        }
      } catch (e) {
        console.error('[Socket] Failed to refresh token after TOKEN_EXPIRED:', e);
      }
    }
    options.onError?.(new Error(data?.message ?? 'Connection error'));
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

export function emitJoinChat(
  chatId: string,
): Promise<{ success: boolean; onlineUsers?: string[] }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: false });
      return;
    }

    socket.emit(
      'chat:join',
      { chatId },
      (response: { success: boolean; onlineUsers?: string[] }) => {
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
